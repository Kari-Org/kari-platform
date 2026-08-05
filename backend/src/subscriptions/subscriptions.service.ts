import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import {
  CarCategory,
  LedgerDirection,
  SubscriptionStatus,
  SystemAccount,
  TransactionType,
} from '@kari/types';
import { haversineKm } from '../common/geo';
import { LedgerService } from '../money/ledger.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { Subscription } from './entities/subscription.entity';
import { type SubscriptionPlan, SUBSCRIPTION_PLANS, planById } from './plans';

// Route-priced fee (spec 0004): 44 = 2 trips × 22 working days; 0.6 = commute
// discount; rounded UP to the next ₦500. Founder-tunable constants.
const MONTHLY_TRIPS = 44;
const COMMUTE_DISCOUNT = 0.6;
const FEE_ROUNDING_NAIRA = 500;
export function monthlyFeeFor(soloFareNaira: number): number {
  return (
    Math.ceil((soloFareNaira * MONTHLY_TRIPS * COMMUTE_DISCOUNT) / FEE_ROUNDING_NAIRA) *
    FEE_ROUNDING_NAIRA
  );
}
const PERIOD_DAYS = 30;

/**
 * Phase 4 — Subscriptions. A prepaid plan (charged from the wallet) that assigns
 * a sticky driver for the same-driver guarantee. Per-ride coverage/metering and
 * auto-renew billing are deferred to a later increment.
 */
@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly subs: Repository<Subscription>,
    private readonly ledger: LedgerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Read a pricing quote straight from Redis (`quote:{ref}`, same key the
   * pricing service writes). Injecting PricingService would create a module
   * cycle (RidesModule already imports SubscriptionsModule for sticky drivers).
   */
  private async getQuote(ref: string): Promise<{
    fares: Array<{ category: CarCategory; amount: number }>;
    pickup: { lat: number; lng: number; address: string | null };
    dropoff: { lat: number; lng: number; address: string | null };
  }> {
    const raw = await this.redis.get(`quote:${ref}`);
    if (!raw) throw new BadRequestException('quote expired — request a new one');
    return JSON.parse(raw);
  }

  /** Fee preview from a quote — clients never compute money (spec 0004, AC-8). */
  async preview(quoteRef: string) {
    const quote = await this.getQuote(quoteRef);
    const solo = quote.fares.find((f) => f.category === CarCategory.ECONOMY);
    if (!solo) throw new BadRequestException('quote has no ECONOMY fare');
    return {
      monthlyFeeNaira: monthlyFeeFor(solo.amount),
      soloFare: solo.amount,
      route: { pickup: quote.pickup, dropoff: quote.dropoff },
    };
  }

  /** Route-priced subscribe (spec 0004): fee from the rider's own route quote. */
  async subscribeRoute(riderId: string, dto: { quoteRef: string; label?: string }) {
    if (await this.activeFor(riderId)) {
      throw new ConflictException('you already have an active subscription');
    }
    const quote = await this.getQuote(dto.quoteRef);
    const solo = quote.fares.find((f) => f.category === CarCategory.ECONOMY);
    if (!solo) throw new BadRequestException('quote has no ECONOMY fare');
    const feeNaira = monthlyFeeFor(solo.amount);
    const feeKobo = feeNaira * 100;
    const wallet = await this.ledger.getOrCreateUserWallet(riderId);
    if (wallet.balance < feeKobo) {
      throw new BadRequestException(`top up ₦${feeNaira} to your wallet to subscribe`);
    }
    const now = new Date();
    const end = new Date(now.getTime() + PERIOD_DAYS * 86_400_000);
    const sub = await this.subs.save(
      this.subs.create({
        riderId,
        planId: null,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        ridesUsed: 0,
        pickupLat: quote.pickup.lat,
        pickupLng: quote.pickup.lng,
        pickupAddress: quote.pickup.address,
        dropoffLat: quote.dropoff.lat,
        dropoffLng: quote.dropoff.lng,
        dropoffAddress: quote.dropoff.address,
        monthlyFeeNaira: feeNaira,
        label: dto.label ?? null,
      }),
    );
    try {
      const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
      await this.ledger.post({
        type: TransactionType.SUBSCRIPTION,
        reference: `sub_${sub.id}`,
        amount: feeKobo,
        legs: [
          { walletId: wallet.id, direction: LedgerDirection.DEBIT, amount: feeKobo },
          { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: feeKobo },
        ],
        userId: riderId,
        metadata: { route: true, monthlyFeeNaira: feeNaira, periodEnd: end.toISOString() },
      });
    } catch (err) {
      await this.subs.delete(sub.id); // roll back the unpaid subscription
      throw err;
    }
    return this.shape(sub);
  }

  /**
   * Free-at-use coverage (spec 0004): the rider's active subscription covers a
   * SOLO ride whose endpoints both lie within `radiusKm` of the subscribed
   * route's endpoints, in either direction. Increments ridesUsed when covering.
   */
  async coverRide(
    riderId: string,
    ride: { pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number },
    radiusKm = 1,
  ): Promise<Subscription | null> {
    const sub = await this.activeFor(riderId);
    if (!sub || sub.pickupLat == null || sub.dropoffLat == null) return null;
    const near = (aLat: number, aLng: number, bLat: number, bLng: number) =>
      haversineKm(aLat, aLng, bLat, bLng) <= radiusKm;
    const forward =
      near(ride.pickupLat, ride.pickupLng, sub.pickupLat, sub.pickupLng!) &&
      near(ride.dropoffLat, ride.dropoffLng, sub.dropoffLat!, sub.dropoffLng!);
    const reverse =
      near(ride.pickupLat, ride.pickupLng, sub.dropoffLat!, sub.dropoffLng!) &&
      near(ride.dropoffLat, ride.dropoffLng, sub.pickupLat, sub.pickupLng!);
    if (!forward && !reverse) return null;
    sub.ridesUsed += 1;
    await this.subs.save(sub);
    return sub;
  }

  listPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  activeFor(riderId: string): Promise<Subscription | null> {
    return this.subs.findOne({ where: { riderId, status: SubscriptionStatus.ACTIVE } });
  }

  async mine(riderId: string) {
    const all = await this.subs.find({ where: { riderId }, order: { createdAt: 'DESC' } });
    return all.map((s) => this.shape(s, s.planId ? planById(s.planId) : undefined));
  }

  async cancel(riderId: string, subId: string) {
    const sub = await this.subs.findOne({ where: { id: subId, riderId } });
    if (!sub) throw new NotFoundException('subscription not found');
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('subscription is not active');
    }
    sub.status = SubscriptionStatus.CANCELLED;
    await this.subs.save(sub);
    return this.shape(sub, sub.planId ? planById(sub.planId) : undefined);
  }

  /** Sticky driver: the first driver to serve an active subscriber sticks. Best-effort. */
  async noteServingDriver(riderId: string, driverId: string): Promise<void> {
    const sub = await this.activeFor(riderId);
    if (sub && !sub.assignedDriverId) {
      sub.assignedDriverId = driverId;
      await this.subs.save(sub);
    }
  }

  private shape(s: Subscription, plan?: SubscriptionPlan) {
    return {
      id: s.id,
      planId: s.planId,
      planName: plan?.name ?? s.label ?? 'My route',
      status: s.status,
      assignedDriverId: s.assignedDriverId,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      ridesUsed: s.ridesUsed,
      includedRides: plan?.includedRides ?? null,
      // Route-priced fields (spec 0004); null on legacy plan subscriptions
      monthlyFeeNaira: s.monthlyFeeNaira,
      label: s.label,
      route:
        s.pickupLat != null && s.dropoffLat != null
          ? {
              pickup: { lat: s.pickupLat, lng: s.pickupLng, address: s.pickupAddress },
              dropoff: { lat: s.dropoffLat, lng: s.dropoffLng, address: s.dropoffAddress },
            }
          : null,
    };
  }
}
