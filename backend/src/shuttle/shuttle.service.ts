import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import {
  LedgerDirection,
  ShuttleBookingStatus,
  ShuttleTripStatus,
  SystemAccount,
  TransactionType,
} from '@kari/types';
import { LedgerService } from '../money/ledger.service';
import { ShuttleBooking } from './entities/shuttle-booking.entity';
import { ShuttleRoute } from './entities/shuttle-route.entity';
import { ShuttleStop } from './entities/shuttle-stop.entity';
import { ShuttleTrip } from './entities/shuttle-trip.entity';

interface SeedStop {
  name: string;
  lat: number;
  lng: number;
  sequence: number;
  fareFromOrigin: number;
}
interface SeedRoute {
  name: string;
  corridor: string;
  stops: SeedStop[];
}

const SEED_ROUTES: SeedRoute[] = [
  {
    name: 'Lekki Corridor',
    corridor: 'LEKKI',
    stops: [
      { name: 'Ikoyi', lat: 6.4541, lng: 3.4348, sequence: 0, fareFromOrigin: 0 },
      { name: 'Lekki Phase 1', lat: 6.4431, lng: 3.472, sequence: 1, fareFromOrigin: 200 },
      { name: 'Chevron', lat: 6.4445, lng: 3.532, sequence: 2, fareFromOrigin: 350 },
      { name: 'Ajah', lat: 6.467, lng: 3.568, sequence: 3, fareFromOrigin: 500 },
    ],
  },
  {
    name: 'Aba Corridor',
    corridor: 'ABA',
    stops: [
      { name: 'Aba Town Hall', lat: 5.1066, lng: 7.3667, sequence: 0, fareFromOrigin: 0 },
      { name: 'Osisioma', lat: 5.145, lng: 7.34, sequence: 1, fareFromOrigin: 150 },
      { name: 'Ariaria Market', lat: 5.128, lng: 7.355, sequence: 2, fareFromOrigin: 300 },
    ],
  },
];
const TRIP_OFFSETS_HOURS = [2, 6, 24];
const TRIP_CAPACITY = 14;

/**
 * Shuttle: fixed routes with ordered stops and scheduled trips. Riders book a
 * seat between two stops; the fare (stop-distance × seats) is charged from the
 * wallet to platform REVENUE. Seat inventory is optimistic-locked. Routes/stops
 * + a few upcoming trips are seeded on boot (idempotent).
 */
@Injectable()
export class ShuttleService implements OnModuleInit {
  private readonly logger = new Logger(ShuttleService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(ShuttleRoute) private readonly routes: Repository<ShuttleRoute>,
    @InjectRepository(ShuttleStop) private readonly stops: Repository<ShuttleStop>,
    @InjectRepository(ShuttleTrip) private readonly trips: Repository<ShuttleTrip>,
    @InjectRepository(ShuttleBooking) private readonly bookings: Repository<ShuttleBooking>,
    private readonly ledger: LedgerService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seed();
    } catch (err) {
      this.logger.error('shuttle seed failed', err as Error);
    }
  }

  // ─── seed ────────────────────────────────────────────────────────────────
  async seed(): Promise<void> {
    for (const def of SEED_ROUTES) {
      let route = await this.routes.findOne({ where: { name: def.name } });
      if (!route) {
        route = await this.routes.save(this.routes.create({ name: def.name, corridor: def.corridor }));
        for (const s of def.stops) {
          await this.stops.save(this.stops.create({ routeId: route.id, ...s }));
        }
        this.logger.log(`seeded shuttle route "${def.name}" with ${def.stops.length} stops`);
      }
      const upcoming = await this.trips.count({
        where: { routeId: route.id, status: ShuttleTripStatus.SCHEDULED, departAt: MoreThan(new Date()) },
      });
      for (let i = upcoming; i < TRIP_OFFSETS_HOURS.length; i++) {
        const departAt = new Date(Date.now() + TRIP_OFFSETS_HOURS[i] * 3_600_000);
        await this.trips.save(
          this.trips.create({ routeId: route.id, departAt, capacity: TRIP_CAPACITY, seatsBooked: 0 }),
        );
      }
    }
  }

  // ─── reads ─────────────────────────────────────────────────────────────────
  async listRoutes() {
    const routes = await this.routes.find({ where: { active: true }, order: { name: 'ASC' } });
    return Promise.all(
      routes.map(async (r) => ({
        ...r,
        stops: await this.stops.find({ where: { routeId: r.id }, order: { sequence: 'ASC' } }),
      })),
    );
  }

  async listTrips(routeId?: string) {
    const trips = await this.trips.find({
      where: {
        status: ShuttleTripStatus.SCHEDULED,
        departAt: MoreThan(new Date()),
        ...(routeId ? { routeId } : {}),
      },
      order: { departAt: 'ASC' },
      take: 50,
    });
    const routeIds = [...new Set(trips.map((t) => t.routeId))];
    const routes = routeIds.length ? await this.routes.find({ where: { id: In(routeIds) } }) : [];
    const nameById = new Map(routes.map((r) => [r.id, r.name]));
    return trips.map((t) => ({
      id: t.id,
      routeId: t.routeId,
      routeName: nameById.get(t.routeId) ?? null,
      departAt: t.departAt,
      capacity: t.capacity,
      seatsBooked: t.seatsBooked,
      seatsAvailable: t.capacity - t.seatsBooked,
      status: t.status,
    }));
  }

  // ─── book / cancel ───────────────────────────────────────────────────────────
  async book(riderId: string, tripId: string, dto: { fromStopId: string; toStopId: string; seats?: number }) {
    const seats = dto.seats ?? 1;
    if (!Number.isInteger(seats) || seats < 1) throw new BadRequestException('seats must be a positive integer');

    const trip = await this.trips.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('trip not found');
    if (trip.status !== ShuttleTripStatus.SCHEDULED) throw new BadRequestException('trip is not open for booking');

    const [from, to] = await Promise.all([
      this.stops.findOne({ where: { id: dto.fromStopId } }),
      this.stops.findOne({ where: { id: dto.toStopId } }),
    ]);
    if (!from || !to || from.routeId !== trip.routeId || to.routeId !== trip.routeId) {
      throw new BadRequestException('both stops must be on this trip’s route');
    }
    if (from.sequence >= to.sequence) throw new BadRequestException('drop-off must be after pickup');
    const fare = (to.fareFromOrigin - from.fareFromOrigin) * seats;
    if (fare <= 0) throw new BadRequestException('invalid fare for this leg');
    const fareKobo = fare * 100;

    const wallet = await this.ledger.getOrCreateUserWallet(riderId);
    if (wallet.balance < fareKobo) throw new BadRequestException(`top up ₦${fare} to book this seat`);

    // Reserve the seat + create the booking atomically (optimistic seat lock).
    let booking: ShuttleBooking;
    try {
      booking = await this.dataSource.transaction(async (m) => {
        const t = await m.findOne(ShuttleTrip, { where: { id: tripId } });
        if (!t) throw new NotFoundException('trip not found');
        if (t.seatsBooked + seats > t.capacity) throw new ConflictException('not enough seats left');
        t.seatsBooked += seats;
        await m.save(t);
        return m.save(
          m.create(ShuttleBooking, {
            tripId,
            riderId,
            fromStopId: from.id,
            toStopId: to.id,
            seats,
            fare,
            status: ShuttleBookingStatus.CONFIRMED,
          }),
        );
      });
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('seats just changed — please try again');
      }
      throw err;
    }

    // Charge the wallet; on failure, release the seat + void the booking.
    try {
      const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
      await this.ledger.post({
        type: TransactionType.RIDE_CHARGE,
        reference: `shuttle_${booking.id}`,
        amount: fareKobo,
        legs: [
          { walletId: wallet.id, direction: LedgerDirection.DEBIT, amount: fareKobo },
          { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: fareKobo },
        ],
        userId: riderId,
        metadata: { tripId, fromStopId: from.id, toStopId: to.id, seats, fare },
      });
    } catch (err) {
      this.logger.error(`shuttle charge failed for booking ${booking.id} — voiding`, err as Error);
      await this.releaseSeats(tripId, seats);
      await this.bookings.update(booking.id, { status: ShuttleBookingStatus.CANCELLED });
      throw new BadRequestException('payment failed — booking was not confirmed');
    }
    return this.bookingView(booking.id);
  }

  async cancel(riderId: string, bookingId: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId, riderId } });
    if (!booking) throw new NotFoundException('booking not found');
    if (booking.status !== ShuttleBookingStatus.CONFIRMED) {
      throw new BadRequestException('only confirmed bookings can be cancelled');
    }
    const wallet = await this.ledger.getOrCreateUserWallet(riderId);
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    await this.ledger.post({
      type: TransactionType.REFUND,
      reference: `shuttle_refund_${bookingId}`,
      amount: booking.fare * 100,
      legs: [
        { walletId: revenue.id, direction: LedgerDirection.DEBIT, amount: booking.fare * 100 },
        { walletId: wallet.id, direction: LedgerDirection.CREDIT, amount: booking.fare * 100 },
      ],
      userId: riderId,
      metadata: { bookingId, tripId: booking.tripId },
    });
    await this.releaseSeats(booking.tripId, booking.seats);
    booking.status = ShuttleBookingStatus.CANCELLED;
    await this.bookings.save(booking);
    return this.bookingView(bookingId);
  }

  private async releaseSeats(tripId: string, seats: number): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const t = await m.findOne(ShuttleTrip, { where: { id: tripId } });
      if (t) {
        t.seatsBooked = Math.max(0, t.seatsBooked - seats);
        await m.save(t);
      }
    });
  }

  async myBookings(riderId: string) {
    const rows = await this.bookings.find({ where: { riderId }, order: { createdAt: 'DESC' } });
    return Promise.all(rows.map((b) => this.shapeBooking(b)));
  }

  private async bookingView(bookingId: string) {
    const b = await this.bookings.findOne({ where: { id: bookingId } });
    if (!b) throw new NotFoundException('booking not found');
    return this.shapeBooking(b);
  }

  private async shapeBooking(b: ShuttleBooking) {
    const [from, to] = await Promise.all([
      this.stops.findOne({ where: { id: b.fromStopId } }),
      this.stops.findOne({ where: { id: b.toStopId } }),
    ]);
    return {
      id: b.id,
      tripId: b.tripId,
      from: from?.name ?? null,
      to: to?.name ?? null,
      seats: b.seats,
      fare: b.fare,
      status: b.status,
      createdAt: b.createdAt,
    };
  }
}
