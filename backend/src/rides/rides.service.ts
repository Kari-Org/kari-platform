import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { In, OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import {
  DriverAvailability,
  NegotiationStatus,
  PaymentMethod,
  PriceType,
  RideStatus,
  RideType,
  UserRole,
} from '@kari/types';
import { DriverService } from '../driver/driver.service';
import type { DriverProfile } from '../driver/entities/driver-profile.entity';
import { PaymentsService } from '../money/payments.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RiderService } from '../rider/rider.service';
import type { RiderProfile } from '../rider/entities/rider-profile.entity';
import type { CancelRideDto } from './dto/cancel-ride.dto';
import type { QuoteDto } from './dto/quote.dto';
import type { RateRideDto } from './dto/rate-ride.dto';
import type { RequestRideDto } from './dto/request-ride.dto';
import { Ride } from './entities/ride.entity';
import { RideOffer } from './entities/ride-offer.entity';
import { Rating } from './entities/rating.entity';
import { MatchingService } from './matching.service';
import { PricingService } from './pricing.service';

const OPEN_STATUSES = [RideStatus.SEARCHING, RideStatus.OFFERED, RideStatus.NEGOTIATING];
/** A rider may only have one ride in flight at a time. */
const ACTIVE_STATUSES = [
  RideStatus.SEARCHING,
  RideStatus.OFFERED,
  RideStatus.NEGOTIATING,
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.IN_PROGRESS,
];

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectRepository(RideOffer) private readonly offers: Repository<RideOffer>,
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
    private readonly pricing: PricingService,
    private readonly matching: MatchingService,
    private readonly realtime: RealtimeService,
    private readonly drivers: DriverService,
    private readonly riders: RiderService,
    private readonly payments: PaymentsService,
  ) {}

  // ─── helpers ──────────────────────────────────────────────────────────────
  private otp(): string {
    return String(randomInt(1000, 10000));
  }

  private driverSummary(d: DriverProfile) {
    return {
      name: [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Your driver',
      personality: d.personality,
      ratingAvg: Number(d.ratingAvg ?? 0),
      ratingCount: d.ratingCount ?? 0,
      vehicle: d.vehicle
        ? {
            brand: d.vehicle.brand,
            model: d.vehicle.model,
            color: d.vehicle.color,
            plateNumber: d.vehicle.plateNumber,
            category: d.vehicle.category,
          }
        : null,
    };
  }

  private riderSummary(r: RiderProfile) {
    return {
      name: [r.firstName, r.lastName].filter(Boolean).join(' ') || 'Your rider',
      ratingAvg: Number(r.ratingAvg ?? 0),
      ratingCount: r.ratingCount ?? 0,
    };
  }

  /**
   * Serialises a ride for one side. Strips the start PIN from non-rider views,
   * and attaches a counterparty summary — the rider sees their driver + vehicle +
   * rating, the driver sees their rider + rating — so the apps show real details
   * instead of placeholders.
   */
  private async view(ride: Ride, viewerRole: UserRole): Promise<Record<string, unknown>> {
    const obj: Record<string, unknown> = { ...ride };
    if (viewerRole !== UserRole.RIDER) {
      delete obj.startOtp;
    }
    if (viewerRole === UserRole.RIDER && ride.driverId) {
      const d = await this.drivers.findByUser(ride.driverId);
      if (d) obj.driver = this.driverSummary(d);
    } else if (viewerRole === UserRole.DRIVER && ride.riderId) {
      const r = await this.riders.getOrCreate(ride.riderId);
      obj.rider = this.riderSummary(r);
    }
    return obj;
  }

  private roleFor(ride: Ride, userId: string): UserRole {
    if (ride.riderId === userId) return UserRole.RIDER;
    if (ride.driverId === userId) return UserRole.DRIVER;
    throw new ForbiddenException('not a participant in this ride');
  }

  private async load(rideId: string): Promise<Ride> {
    const ride = await this.rides.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('ride not found');
    }
    return ride;
  }

  private async saveLocked(ride: Ride): Promise<Ride> {
    try {
      return await this.rides.save(ride);
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('ride was just updated by someone else — try again');
      }
      throw err;
    }
  }

  // ─── rider: quote + request ────────────────────────────────────────────────
  quote(dto: QuoteDto) {
    return this.pricing.quote(dto);
  }

  async request(riderId: string, dto: RequestRideDto) {
    const active = await this.rides.findOne({
      where: { riderId, status: In(ACTIVE_STATUSES) },
    });
    if (active) {
      throw new ConflictException('you already have an active ride');
    }
    const quote = await this.pricing.getQuote(dto.quoteRef);
    const fare = quote.fares.find((f) => f.category === dto.carCategory);
    if (!fare) {
      throw new BadRequestException('invalid car category for this quote');
    }
    const priceType = dto.priceType ?? PriceType.STANDARD;
    if (priceType === PriceType.NEGOTIATE && dto.riderProposedPrice == null) {
      throw new BadRequestException('riderProposedPrice is required for a NEGOTIATE ride');
    }

    const rider = await this.riders.getOrCreate(riderId);
    let ride = this.rides.create({
      type: RideType.SOLO,
      status: RideStatus.SEARCHING,
      riderId,
      pickupLat: quote.pickup.lat,
      pickupLng: quote.pickup.lng,
      pickupAddress: quote.pickup.address,
      dropoffLat: quote.dropoff.lat,
      dropoffLng: quote.dropoff.lng,
      dropoffAddress: quote.dropoff.address,
      distanceMeters: quote.distanceMeters,
      durationSeconds: quote.durationSeconds,
      carCategory: dto.carCategory,
      priceType,
      paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
      quotedPrice: fare.amount,
      riderProposedPrice: priceType === PriceType.NEGOTIATE ? dto.riderProposedPrice! : null,
      agreedPrice: priceType === PriceType.STANDARD ? fare.amount : null,
    });
    ride = await this.rides.save(ride);

    const candidates = await this.matching.findCandidates(
      quote.pickup.lat,
      quote.pickup.lng,
      dto.carCategory,
      rider.preferredDriverBehavior,
    );
    if (candidates.length > 0) {
      ride.status = RideStatus.OFFERED;
      ride = await this.rides.save(ride);
      const offer = await this.view(ride, UserRole.DRIVER);
      for (const driverId of candidates) {
        this.realtime.emitToUser(driverId, 'ride:offer', offer);
      }
    }
    return { ride: await this.view(ride, UserRole.RIDER), dispatchedTo: candidates.length };
  }

  // ─── driver: accept (standard) ──────────────────────────────────────────────
  async accept(driverId: string, rideId: string) {
    const ride = await this.load(rideId);
    if (ride.priceType !== PriceType.STANDARD) {
      throw new BadRequestException('this ride is negotiable — submit an offer instead');
    }
    if (!OPEN_STATUSES.includes(ride.status)) {
      throw new ConflictException('ride is no longer available');
    }
    ride.driverId = driverId;
    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    ride.agreedPrice = ride.quotedPrice;
    ride.startOtp = this.otp();
    const saved = await this.saveLocked(ride);
    await this.drivers.setAvailability(driverId, DriverAvailability.ON_TRIP);
    this.realtime.emitToUser(ride.riderId, 'ride:accepted', await this.view(saved, UserRole.RIDER));
    return this.view(saved, UserRole.DRIVER);
  }

  // ─── negotiation ────────────────────────────────────────────────────────────
  async makeOffer(driverId: string, rideId: string, amount: number) {
    const ride = await this.load(rideId);
    if (ride.priceType !== PriceType.NEGOTIATE) {
      throw new BadRequestException('this ride is not negotiable');
    }
    if (!OPEN_STATUSES.includes(ride.status)) {
      throw new ConflictException('ride is no longer open');
    }
    if (amount > ride.quotedPrice) {
      throw new BadRequestException(`offer cannot exceed the standard fare of ₦${ride.quotedPrice}`);
    }
    const offer = await this.offers.save(this.offers.create({ rideId, driverId, amount }));
    if (ride.status !== RideStatus.NEGOTIATING) {
      ride.status = RideStatus.NEGOTIATING;
      await this.rides.save(ride);
    }
    this.realtime.emitToUser(ride.riderId, 'ride:offer:driver', {
      offerId: offer.id,
      driverId,
      amount,
    });
    return offer;
  }

  async acceptOffer(riderId: string, rideId: string, offerId: string) {
    const ride = await this.load(rideId);
    if (ride.riderId !== riderId) {
      throw new ForbiddenException('not your ride');
    }
    if (!OPEN_STATUSES.includes(ride.status)) {
      throw new ConflictException('ride is no longer open');
    }
    const offer = await this.offers.findOne({ where: { id: offerId, rideId } });
    if (!offer || offer.status !== NegotiationStatus.PENDING) {
      throw new NotFoundException('offer not found or no longer pending');
    }
    ride.driverId = offer.driverId;
    ride.agreedPrice = offer.amount;
    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    ride.startOtp = this.otp();
    const saved = await this.saveLocked(ride);

    offer.status = NegotiationStatus.ACCEPTED;
    await this.offers.save(offer);
    await this.offers.update(
      { rideId, status: NegotiationStatus.PENDING },
      { status: NegotiationStatus.REJECTED },
    );
    await this.drivers.setAvailability(offer.driverId, DriverAvailability.ON_TRIP);
    this.realtime.emitToUser(offer.driverId, 'ride:accepted', await this.view(saved, UserRole.DRIVER));
    return this.view(saved, UserRole.RIDER);
  }

  // ─── driver: arrive / start / complete ─────────────────────────────────────
  async arrived(driverId: string, rideId: string) {
    const ride = await this.load(rideId);
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('not your ride');
    }
    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException('ride must be ACCEPTED to mark arrival');
    }
    ride.status = RideStatus.DRIVER_ARRIVED;
    ride.arrivedAt = new Date();
    const saved = await this.rides.save(ride);
    this.realtime.emitToUser(ride.riderId, 'ride:arrived', await this.view(saved, UserRole.RIDER));
    return this.view(saved, UserRole.DRIVER);
  }

  async start(driverId: string, rideId: string, otp: string) {
    const ride = await this.load(rideId);
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('not your ride');
    }
    if (ride.status !== RideStatus.ACCEPTED && ride.status !== RideStatus.DRIVER_ARRIVED) {
      throw new BadRequestException('ride is not ready to start');
    }
    if (!ride.startOtp || ride.startOtp !== otp) {
      throw new BadRequestException('incorrect start code');
    }
    ride.status = RideStatus.IN_PROGRESS;
    ride.startedAt = new Date();
    const saved = await this.rides.save(ride);
    this.realtime.emitToUser(ride.riderId, 'ride:started', await this.view(saved, UserRole.RIDER));
    return this.view(saved, UserRole.DRIVER);
  }

  async complete(driverId: string, rideId: string) {
    const ride = await this.load(rideId);
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('not your ride');
    }
    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('ride must be in progress to complete');
    }
    // Settle the fare first (idempotent by ride id). If this throws, the ride
    // stays IN_PROGRESS so the driver can safely retry completing it.
    const settlement = await this.payments.settleRide({
      rideId: ride.id,
      riderId: ride.riderId,
      driverId: ride.driverId,
      fareNaira: ride.agreedPrice ?? ride.quotedPrice,
      paymentMethod: ride.paymentMethod,
    });
    ride.status = RideStatus.COMPLETED;
    ride.completedAt = new Date();
    if (settlement.settled) {
      ride.commission = Math.round(settlement.commissionKobo / 100);
      ride.driverEarnings = Math.round(settlement.driverNetKobo / 100);
      ride.settledAt = new Date();
    }
    const saved = await this.rides.save(ride);
    await this.drivers.setAvailability(driverId, DriverAvailability.ONLINE);
    this.realtime.emitToUser(ride.riderId, 'ride:completed', await this.view(saved, UserRole.RIDER));
    return this.view(saved, UserRole.DRIVER);
  }

  // ─── cancel / rate / read ──────────────────────────────────────────────────
  async cancel(userId: string, role: UserRole, rideId: string, dto: CancelRideDto) {
    const ride = await this.load(rideId);
    this.roleFor(ride, userId);
    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new BadRequestException(`cannot cancel a ${ride.status.toLowerCase()} ride`);
    }
    // Capture commitment context before mutating: a penalty only applies once a
    // driver was assigned (driverId set at ACCEPTED) and past the grace window.
    const driverId = ride.driverId;
    const secondsSinceAccept = ride.acceptedAt
      ? Math.max(0, Math.floor((Date.now() - ride.acceptedAt.getTime()) / 1000))
      : null;

    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancelReason = dto.reason ?? null;
    const saved = await this.rides.save(ride);
    if (driverId) {
      await this.drivers.setAvailability(driverId, DriverAvailability.ONLINE);
    }

    // Cancellation penalty is best-effort — it must never block the cancel itself.
    try {
      await this.payments.applyCancellationPenalty({
        rideId: ride.id,
        riderId: ride.riderId,
        driverId,
        cancelledBy: role,
        secondsSinceAccept,
      });
    } catch (err) {
      this.logger.error(`cancellation penalty for ride ${ride.id} failed`, err as Error);
    }

    const otherId = userId === ride.riderId ? ride.driverId : ride.riderId;
    if (otherId) {
      this.realtime.emitToUser(otherId, 'ride:cancelled', { rideId, reason: ride.cancelReason });
    }
    return this.view(saved, role);
  }

  async rate(userId: string, role: UserRole, rideId: string, dto: RateRideDto) {
    const ride = await this.load(rideId);
    this.roleFor(ride, userId);
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('can only rate completed rides');
    }
    let rateeId: string | null;
    if (role === UserRole.RIDER) {
      if (ride.riderRated) throw new BadRequestException('you already rated this ride');
      rateeId = ride.driverId;
    } else {
      if (ride.driverRated) throw new BadRequestException('you already rated this ride');
      rateeId = ride.riderId;
    }
    if (!rateeId) {
      throw new BadRequestException('no counterparty to rate');
    }

    const rating = await this.ratings.save(
      this.ratings.create({
        rideId,
        raterId: userId,
        rateeId,
        raterRole: role,
        stars: dto.stars,
        comment: dto.comment ?? null,
      }),
    );

    if (role === UserRole.RIDER) {
      await this.drivers.addRating(rateeId, dto.stars);
      ride.riderRated = true;
    } else {
      await this.riders.addRating(rateeId, dto.stars);
      ride.driverRated = true;
    }
    await this.rides.save(ride);
    return rating;
  }

  async getOne(userId: string, rideId: string) {
    const ride = await this.load(rideId);
    return this.view(ride, this.roleFor(ride, userId));
  }

  async getMine(userId: string) {
    const rides = await this.rides.find({
      where: [{ riderId: userId }, { driverId: userId }],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      rides.map((r) => this.view(r, r.riderId === userId ? UserRole.RIDER : UserRole.DRIVER)),
    );
  }
}
