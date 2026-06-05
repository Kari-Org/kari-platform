import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerDirection, SubscriptionStatus, SystemAccount, TransactionType } from '@kari/types';
import { LedgerService } from '../money/ledger.service';
import { Subscription } from './entities/subscription.entity';
import { type SubscriptionPlan, SUBSCRIPTION_PLANS, planById } from './plans';

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
  ) {}

  listPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  activeFor(riderId: string): Promise<Subscription | null> {
    return this.subs.findOne({ where: { riderId, status: SubscriptionStatus.ACTIVE } });
  }

  async subscribe(riderId: string, planId: string) {
    const plan = planById(planId);
    if (!plan) throw new BadRequestException('unknown subscription plan');
    if (await this.activeFor(riderId)) {
      throw new ConflictException('you already have an active subscription');
    }
    const feeKobo = plan.priceNaira * 100;
    const wallet = await this.ledger.getOrCreateUserWallet(riderId);
    if (wallet.balance < feeKobo) {
      throw new BadRequestException(`top up ₦${plan.priceNaira} to your wallet to subscribe`);
    }
    const now = new Date();
    const end = new Date(now.getTime() + plan.billingCycleDays * 86_400_000);
    const sub = await this.subs.save(
      this.subs.create({
        riderId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        ridesUsed: 0,
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
        metadata: { planId, periodEnd: end.toISOString() },
      });
    } catch (err) {
      await this.subs.delete(sub.id); // roll back the unpaid subscription
      throw err;
    }
    return this.shape(sub, plan);
  }

  async mine(riderId: string) {
    const all = await this.subs.find({ where: { riderId }, order: { createdAt: 'DESC' } });
    return all.map((s) => this.shape(s, planById(s.planId)));
  }

  async cancel(riderId: string, subId: string) {
    const sub = await this.subs.findOne({ where: { id: subId, riderId } });
    if (!sub) throw new NotFoundException('subscription not found');
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('subscription is not active');
    }
    sub.status = SubscriptionStatus.CANCELLED;
    await this.subs.save(sub);
    return this.shape(sub, planById(sub.planId));
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
      planName: plan?.name ?? s.planId,
      status: s.status,
      assignedDriverId: s.assignedDriverId,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      ridesUsed: s.ridesUsed,
      includedRides: plan?.includedRides ?? null,
    };
  }
}
