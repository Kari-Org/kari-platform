import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import {
  BehaviorPreference,
  CarpoolStatus,
  KycStatus,
  LedgerDirection,
  SystemAccount,
  TransactionType,
} from '@kari/types';
import { CommissionService } from '../money/commission.service';
import { LedgerService } from '../money/ledger.service';
import { MatchingService } from '../rides/matching.service';
import { PricingService } from '../rides/pricing.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RiderService } from '../rider/rider.service';
import { CarpoolMember } from './entities/carpool-member.entity';
import { Carpool } from './entities/carpool.entity';

export const CARPOOL_MAX_SEATS = 4;
const JOINABLE = [CarpoolStatus.OPEN, CarpoolStatus.MATCHED];

/**
 * Carpooling: NIN-verified riders form a shared ride and split the fare. Seat
 * claims are optimistic-locked (first wins the last seat); the total fare is
 * settled across all members in a single balanced ledger transaction on
 * completion, with the driver paid net and the platform taking commission.
 */
@Injectable()
export class CarpoolsService {
  private readonly logger = new Logger(CarpoolsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Carpool) private readonly carpools: Repository<Carpool>,
    @InjectRepository(CarpoolMember) private readonly members: Repository<CarpoolMember>,
    private readonly riders: RiderService,
    private readonly pricing: PricingService,
    private readonly matching: MatchingService,
    private readonly ledger: LedgerService,
    private readonly commission: CommissionService,
    private readonly realtime: RealtimeService,
  ) {}

  // ─── NIN gate ────────────────────────────────────────────────────────────────
  private async requireNinVerified(riderId: string): Promise<void> {
    const profile = await this.riders.getOrCreate(riderId);
    if (profile.ninStatus !== KycStatus.VERIFIED) {
      throw new ForbiddenException('NIN verification is required to use carpooling');
    }
  }

  private async activeMembershipOf(riderId: string): Promise<CarpoolMember | null> {
    const memberships = await this.members.find({ where: { riderId, status: 'JOINED' } });
    for (const m of memberships) {
      const cp = await this.carpools.findOne({ where: { id: m.carpoolId } });
      if (cp && JOINABLE.includes(cp.status)) return m;
    }
    return null;
  }

  // ─── create ────────────────────────────────────────────────────────────────
  async create(
    creatorId: string,
    dto: { quoteRef: string; carCategory: string; maxSeats?: number; departAt?: string },
  ) {
    await this.requireNinVerified(creatorId);
    if (await this.activeMembershipOf(creatorId)) {
      throw new ConflictException('you are already in an active carpool');
    }
    const quote = await this.pricing.getQuote(dto.quoteRef);
    const fare = quote.fares.find((f) => f.category === dto.carCategory);
    if (!fare) throw new BadRequestException('invalid car category for this quote');

    const maxSeats = Math.min(Math.max(dto.maxSeats ?? CARPOOL_MAX_SEATS, 2), CARPOOL_MAX_SEATS);
    const carpool = await this.carpools.save(
      this.carpools.create({
        creatorId,
        status: CarpoolStatus.OPEN,
        pickupLat: quote.pickup.lat,
        pickupLng: quote.pickup.lng,
        pickupAddress: quote.pickup.address,
        dropoffLat: quote.dropoff.lat,
        dropoffLng: quote.dropoff.lng,
        dropoffAddress: quote.dropoff.address,
        distanceMeters: quote.distanceMeters,
        durationSeconds: quote.durationSeconds,
        carCategory: dto.carCategory as Carpool['carCategory'],
        totalFare: fare.amount,
        maxSeats,
        seatsTaken: 1,
        departAt: dto.departAt ? new Date(dto.departAt) : null,
      }),
    );
    await this.members.save(
      this.members.create({
        carpoolId: carpool.id,
        riderId: creatorId,
        isCreator: true,
        shareAmount: fare.amount,
        status: 'JOINED',
      }),
    );

    // Dispatch to nearby drivers (reuse ride matching).
    const candidates = await this.matching.findCandidates(
      quote.pickup.lat,
      quote.pickup.lng,
      dto.carCategory as Carpool['carCategory'],
      BehaviorPreference.NO_PREFERENCE,
    );
    const offer = await this.view(carpool.id);
    for (const driverId of candidates) {
      this.realtime.emitToUser(driverId, 'carpool:offer', offer);
    }
    return { carpool: offer, dispatchedTo: candidates.length };
  }

  // ─── join (optimistic-locked seat claim) ─────────────────────────────────────
  async join(riderId: string, carpoolId: string) {
    await this.requireNinVerified(riderId);
    if (await this.activeMembershipOf(riderId)) {
      throw new ConflictException('you are already in an active carpool');
    }
    try {
      await this.dataSource.transaction(async (m) => {
        const cp = await m.findOne(Carpool, { where: { id: carpoolId } });
        if (!cp) throw new NotFoundException('carpool not found');
        if (!JOINABLE.includes(cp.status)) throw new ConflictException('this carpool is no longer joinable');
        if (cp.seatsTaken >= cp.maxSeats) throw new ConflictException('this carpool is full');

        const existing = await m.findOne(CarpoolMember, { where: { carpoolId, riderId } });
        if (existing?.status === 'JOINED') throw new ConflictException('you are already in this carpool');
        if (existing) {
          existing.status = 'JOINED';
          await m.save(existing);
        } else {
          await m.save(m.create(CarpoolMember, { carpoolId, riderId, status: 'JOINED' }));
        }
        cp.seatsTaken += 1;
        await m.save(cp); // optimistic version bump — concurrent claim fails here
        await this.recompute(m, cp);
      });
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('a seat was just claimed — please try again');
      }
      throw err;
    }
    const view = await this.view(carpoolId);
    this.realtime.emitToUser((await this.carpools.findOne({ where: { id: carpoolId } }))!.creatorId, 'carpool:joined', view);
    return view;
  }

  async leave(riderId: string, carpoolId: string) {
    await this.dataSource.transaction(async (m) => {
      const cp = await m.findOne(Carpool, { where: { id: carpoolId } });
      if (!cp) throw new NotFoundException('carpool not found');
      const member = await m.findOne(CarpoolMember, { where: { carpoolId, riderId, status: 'JOINED' } });
      if (!member) throw new BadRequestException('you are not in this carpool');
      if (member.isCreator) throw new BadRequestException('the creator cancels the carpool instead of leaving');
      if (!JOINABLE.includes(cp.status)) throw new ConflictException('this carpool can no longer be left');
      member.status = 'LEFT';
      await m.save(member);
      cp.seatsTaken = Math.max(0, cp.seatsTaken - 1);
      await m.save(cp);
      await this.recompute(m, cp);
    });
    return this.view(carpoolId);
  }

  /** Recompute every active member's share = totalFare / member-count. */
  private async recompute(m: EntityManager, carpool: Carpool): Promise<void> {
    const active = await m.find(CarpoolMember, { where: { carpoolId: carpool.id, status: 'JOINED' } });
    const share = Math.round(carpool.totalFare / Math.max(active.length, 1));
    for (const mem of active) {
      mem.shareAmount = share;
      await m.save(mem);
    }
  }

  // ─── driver accept / complete ────────────────────────────────────────────────
  async accept(driverId: string, carpoolId: string) {
    const cp = await this.load(carpoolId);
    if (cp.status !== CarpoolStatus.OPEN) throw new ConflictException('carpool is no longer open');
    cp.driverId = driverId;
    cp.status = CarpoolStatus.MATCHED;
    cp.acceptedAt = new Date();
    await this.carpools.save(cp);
    this.realtime.emitToUser(cp.creatorId, 'carpool:matched', await this.view(carpoolId));
    return this.view(carpoolId);
  }

  async complete(driverId: string, carpoolId: string) {
    const cp = await this.load(carpoolId);
    if (cp.driverId !== driverId) throw new ForbiddenException('not your carpool');
    if (cp.status !== CarpoolStatus.MATCHED && cp.status !== CarpoolStatus.IN_PROGRESS) {
      throw new BadRequestException('carpool must be matched/in-progress to complete');
    }
    await this.settle(cp);
    cp.status = CarpoolStatus.COMPLETED;
    cp.completedAt = new Date();
    await this.carpools.save(cp);
    return this.view(carpoolId);
  }

  /** Settle the whole fare across members in one balanced transaction. */
  private async settle(cp: Carpool): Promise<void> {
    if (!cp.driverId) return;
    const active = await this.members.find({ where: { carpoolId: cp.id, status: 'JOINED' } });
    const n = active.length;
    const totalKobo = cp.totalFare * 100;
    if (n === 0 || totalKobo <= 0) return;

    const rateBps = await this.commission.resolveRateBps(cp.driverId);
    const commission = Math.round((totalKobo * rateBps) / 10_000);
    const driverNet = totalKobo - commission;

    // Distribute the total across members so the legs sum exactly to totalKobo.
    const base = Math.floor(totalKobo / n);
    let remainder = totalKobo - base * n;
    const legs = [] as Array<{ walletId: string; direction: LedgerDirection; amount: number }>;
    for (const mem of active) {
      const amount = base + (remainder-- > 0 ? 1 : 0);
      const wallet = await this.ledger.getOrCreateUserWallet(mem.riderId);
      legs.push({ walletId: wallet.id, direction: LedgerDirection.DEBIT, amount });
    }
    const driverWallet = await this.ledger.getOrCreateUserWallet(cp.driverId);
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    legs.push({ walletId: driverWallet.id, direction: LedgerDirection.CREDIT, amount: driverNet });
    if (commission > 0) legs.push({ walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: commission });

    await this.ledger.post({
      type: TransactionType.RIDE_CHARGE,
      reference: `carpool_${cp.id}`,
      amount: totalKobo,
      legs,
      rideId: cp.id,
      metadata: { members: n, rateBps, commission, driverNet },
    });
  }

  async cancel(userId: string, carpoolId: string) {
    const cp = await this.load(carpoolId);
    if (cp.creatorId !== userId && cp.driverId !== userId) {
      throw new ForbiddenException('only the creator or driver can cancel');
    }
    if (cp.status === CarpoolStatus.COMPLETED || cp.status === CarpoolStatus.CANCELLED) {
      throw new BadRequestException(`cannot cancel a ${cp.status.toLowerCase()} carpool`);
    }
    cp.status = CarpoolStatus.CANCELLED;
    cp.cancelledAt = new Date();
    await this.carpools.save(cp);
    return this.view(carpoolId);
  }

  // ─── reads ─────────────────────────────────────────────────────────────────
  private async load(carpoolId: string): Promise<Carpool> {
    const cp = await this.carpools.findOne({ where: { id: carpoolId } });
    if (!cp) throw new NotFoundException('carpool not found');
    return cp;
  }

  /** Open carpools near a point that still have seats — discoverable to join. */
  async listJoinable(lat: number, lng: number) {
    const open = await this.carpools.find({ where: { status: CarpoolStatus.OPEN }, order: { createdAt: 'DESC' }, take: 50 });
    const near = open.filter((cp) => cp.seatsTaken < cp.maxSeats && haversineKm(lat, lng, cp.pickupLat, cp.pickupLng) <= 5);
    return Promise.all(near.map((cp) => this.view(cp.id)));
  }

  async mine(riderId: string) {
    const memberships = await this.members.find({ where: { riderId }, order: { createdAt: 'DESC' } });
    return Promise.all(memberships.map((m) => this.view(m.carpoolId)));
  }

  async getOne(carpoolId: string) {
    return this.view(carpoolId);
  }

  private async view(carpoolId: string) {
    const cp = await this.load(carpoolId);
    const members = await this.members.find({ where: { carpoolId, status: 'JOINED' }, order: { createdAt: 'ASC' } });
    return {
      ...cp,
      members: members.map((m) => ({ riderId: m.riderId, shareAmount: m.shareAmount, isCreator: m.isCreator })),
      seatsAvailable: cp.maxSeats - cp.seatsTaken,
    };
  }
}

/** Great-circle distance in km (joinable-radius filter). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  return 2 * R * Math.asin(Math.sqrt(a));
}
