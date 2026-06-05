import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerDirection,
  PaymentMethod,
  SystemAccount,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@kari/types';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { DriverService } from '../driver/driver.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../providers/contracts';
import { UsersService } from '../users/users.service';
import { CommissionService } from './commission.service';
import { Transaction } from './entities/transaction.entity';
import { LedgerService, type PostLeg } from './ledger.service';

/** Ride fields needed to settle — passed by RidesService so money never imports rides. */
export interface RideSettlement {
  rideId: string;
  riderId: string;
  driverId: string | null;
  fareNaira: number; // agreedPrice
  paymentMethod: PaymentMethod;
}

export interface RideCancellation {
  rideId: string;
  riderId: string;
  driverId: string | null;
  cancelledBy: UserRole;
  /** Seconds between driver-accept and cancel; null if no driver was ever assigned. */
  secondsSinceAccept: number | null;
}

export interface SettlementResult {
  settled: boolean;
  paymentMethod: PaymentMethod;
  rateBps: number;
  fareKobo: number;
  commissionKobo: number;
  driverNetKobo: number;
}

const toKobo = (naira: number): number => Math.round(naira) * 100;
const isCashlike = (m: PaymentMethod): boolean =>
  m === PaymentMethod.WALLET || m === PaymentMethod.CARD || m === PaymentMethod.IN_APP_TRANSFER;

/**
 * Orchestrates money movement: top-ups (in), payouts (out), ride settlement, and
 * cancellation penalties. Every balance change is posted through LedgerService
 * (double-entry). The gateway (Paystack / noop) sits behind PaymentProvider.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    private readonly ledger: LedgerService,
    private readonly commission: CommissionService,
    private readonly users: UsersService,
    private readonly drivers: DriverService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
  ) {}

  // ─── top-up (money in) ──────────────────────────────────────────────────────
  async initiateTopup(userId: string, amountNaira: number) {
    const min = this.config.money.minTopup;
    if (!Number.isFinite(amountNaira) || amountNaira < min) {
      throw new BadRequestException(`minimum top-up is ₦${min}`);
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('user not found');

    const amountKobo = toKobo(amountNaira);
    const reference = `topup_${randomUUID()}`;
    const charge = await this.provider.initiateCharge({
      amount: amountKobo,
      email: user.email,
      reference,
      metadata: { userId },
    });
    // Record the intent as PENDING — no ledger entries until the gateway confirms.
    await this.transactions.save(
      this.transactions.create({
        type: TransactionType.TOPUP,
        status: TransactionStatus.PENDING,
        reference,
        amount: amountKobo,
        userId,
        provider: this.provider.name,
        metadata: { authorizationUrl: charge.authorizationUrl ?? null },
      }),
    );
    return {
      reference,
      authorizationUrl: charge.authorizationUrl ?? null,
      amount: amountNaira,
      amountKobo,
      status: 'pending' as const,
      provider: this.provider.name,
    };
  }

  /** Verify a top-up with the gateway and, on success, credit the wallet. Idempotent. */
  async confirmTopup(reference: string) {
    const txn = await this.transactions.findOne({ where: { reference } });
    if (!txn || txn.type !== TransactionType.TOPUP) throw new NotFoundException('top-up not found');
    if (txn.status === TransactionStatus.SUCCESS) return this.shape(txn);
    if (!txn.userId) throw new BadRequestException('top-up has no user');

    const status = await this.provider.verifyCharge(reference);
    if (status === 'failed') {
      await this.transactions.update({ reference }, { status: TransactionStatus.FAILED });
      return this.shape({ ...txn, status: TransactionStatus.FAILED });
    }
    if (status !== 'success') return this.shape(txn); // still pending

    // Money came in from outside: GATEWAY goes negative, user wallet is credited.
    const userWallet = await this.ledger.getOrCreateUserWallet(txn.userId);
    const gateway = await this.ledger.systemWallet(SystemAccount.GATEWAY);
    const settled = await this.ledger.settlePending(
      reference,
      [
        { walletId: gateway.id, direction: LedgerDirection.DEBIT, amount: txn.amount },
        { walletId: userWallet.id, direction: LedgerDirection.CREDIT, amount: txn.amount },
      ],
      { providerRef: reference },
    );
    return this.shape(settled);
  }

  // ─── ride settlement (money earned) ─────────────────────────────────────────
  async settleRide(input: RideSettlement): Promise<SettlementResult> {
    const { rideId, riderId, driverId, fareNaira, paymentMethod } = input;
    const fareKobo = toKobo(fareNaira);
    const base: SettlementResult = {
      settled: false,
      paymentMethod,
      rateBps: 0,
      fareKobo,
      commissionKobo: 0,
      driverNetKobo: fareKobo,
    };
    if (!driverId || fareKobo <= 0) return base;

    const rateBps = await this.commission.resolveRateBps(driverId);
    const { commission, driverNet } = this.commission.computeSplit(fareKobo, rateBps);
    const driverWallet = await this.ledger.getOrCreateUserWallet(driverId);
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    const reference = `ride_${rideId}`;
    const metadata = { rateBps, fareKobo, commission, driverNet };

    if (isCashlike(paymentMethod)) {
      // Platform collects the full fare from the rider, pays the driver their net,
      // and keeps the commission.
      const riderWallet = await this.ledger.getOrCreateUserWallet(riderId);
      const legs: PostLeg[] = [
        { walletId: riderWallet.id, direction: LedgerDirection.DEBIT, amount: fareKobo },
        { walletId: driverWallet.id, direction: LedgerDirection.CREDIT, amount: driverNet },
        { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: commission },
      ].filter((l) => l.amount > 0);
      await this.ledger.post({
        type: TransactionType.RIDE_CHARGE,
        reference,
        amount: fareKobo,
        legs,
        userId: riderId,
        rideId,
        paymentMethod,
        metadata,
      });
    } else {
      // CASH: rider pays the driver directly; the platform only collects its
      // commission FROM the driver (driver wallet may go negative = owes platform).
      if (commission <= 0) return { ...base, rateBps, driverNetKobo: driverNet };
      await this.ledger.post({
        type: TransactionType.COMMISSION,
        reference,
        amount: commission,
        legs: [
          { walletId: driverWallet.id, direction: LedgerDirection.DEBIT, amount: commission },
          { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: commission },
        ],
        userId: driverId,
        rideId,
        paymentMethod,
        metadata,
      });
    }
    return { settled: true, paymentMethod, rateBps, fareKobo, commissionKobo: commission, driverNetKobo: driverNet };
  }

  // ─── cancellation penalty ────────────────────────────────────────────────────
  async applyCancellationPenalty(input: RideCancellation): Promise<Transaction | null> {
    const { rideId, riderId, driverId, cancelledBy, secondsSinceAccept } = input;
    const money = this.config.money;
    // Free if no driver had committed, or still within the post-accept grace
    // window (the first `cancellationGraceSeconds` are free; 0 ⇒ always charge).
    if (!driverId) return null;
    if (secondsSinceAccept !== null && secondsSinceAccept < money.cancellationGraceSeconds) {
      return null;
    }
    const reference = `penalty_${rideId}`;

    if (cancelledBy === UserRole.RIDER) {
      const feeKobo = toKobo(money.cancellationFee);
      if (feeKobo <= 0) return null;
      const driverShare = Math.round((feeKobo * money.penaltyDriverShareBps) / 10_000);
      const platformShare = feeKobo - driverShare;
      const riderWallet = await this.ledger.getOrCreateUserWallet(riderId);
      const driverWallet = await this.ledger.getOrCreateUserWallet(driverId);
      const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
      const legs: PostLeg[] = [
        { walletId: riderWallet.id, direction: LedgerDirection.DEBIT, amount: feeKobo },
        { walletId: driverWallet.id, direction: LedgerDirection.CREDIT, amount: driverShare },
        { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: platformShare },
      ].filter((l) => l.amount > 0);
      return this.ledger.post({
        type: TransactionType.PENALTY,
        reference,
        amount: feeKobo,
        legs,
        userId: riderId,
        rideId,
        metadata: { cancelledBy, driverShare, platformShare },
      });
    }

    // Driver cancelled post-accept: optional fee to the platform (default ₦0 = strike only).
    const feeKobo = toKobo(money.driverCancelFee);
    if (feeKobo <= 0) return null;
    const driverWallet = await this.ledger.getOrCreateUserWallet(driverId);
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    return this.ledger.post({
      type: TransactionType.PENALTY,
      reference,
      amount: feeKobo,
      legs: [
        { walletId: driverWallet.id, direction: LedgerDirection.DEBIT, amount: feeKobo },
        { walletId: revenue.id, direction: LedgerDirection.CREDIT, amount: feeKobo },
      ],
      userId: driverId,
      rideId,
      metadata: { cancelledBy },
    });
  }

  // ─── payout (money out) ───────────────────────────────────────────────────────
  async requestPayout(driverId: string, amountNaira: number) {
    const min = this.config.money.minPayout;
    if (!Number.isFinite(amountNaira) || amountNaira < min) {
      throw new BadRequestException(`minimum payout is ₦${min}`);
    }
    const amountKobo = toKobo(amountNaira);
    const wallet = await this.ledger.getOrCreateUserWallet(driverId);
    if (wallet.balance < amountKobo) {
      throw new BadRequestException('insufficient wallet balance for this payout');
    }
    const profile = await this.drivers.findByUser(driverId);
    if (!profile?.bankAccountNumber) {
      throw new BadRequestException('add a payout bank account before withdrawing');
    }

    const reference = `payout_${randomUUID()}`;
    const gateway = await this.ledger.systemWallet(SystemAccount.GATEWAY);
    // Reserve the funds first (debit driver, credit gateway), then send the transfer.
    await this.ledger.post({
      type: TransactionType.RIDE_PAYOUT,
      reference,
      amount: amountKobo,
      status: TransactionStatus.PENDING,
      legs: [
        { walletId: wallet.id, direction: LedgerDirection.DEBIT, amount: amountKobo },
        { walletId: gateway.id, direction: LedgerDirection.CREDIT, amount: amountKobo },
      ],
      userId: driverId,
      provider: this.provider.name,
    });

    try {
      const transfer = await this.provider.initiateTransfer({
        amount: amountKobo,
        reference,
        recipient: {
          name: profile.bankAccountName ?? 'Kari driver',
          accountNumber: profile.bankAccountNumber,
          bankCode: profile.bankName ?? '',
        },
        reason: 'Kari driver payout',
      });
      await this.transactions.update(
        { reference },
        {
          status: transfer.status === 'success' ? TransactionStatus.SUCCESS : TransactionStatus.PENDING,
          providerRef: transfer.providerRef ?? null,
        },
      );
    } catch (err) {
      this.logger.error(`payout ${reference} failed to initiate — reversing`, err as Error);
      const txn = await this.transactions.findOne({ where: { reference } });
      if (txn) await this.reversePayout(txn);
      throw new BadRequestException('payout could not be initiated — your balance was not changed');
    }

    const fresh = await this.transactions.findOne({ where: { reference } });
    return this.shape(fresh!);
  }

  /** Finalise an async payout from a webhook (real Paystack transfers settle later). */
  private async confirmPayout(reference: string): Promise<void> {
    const txn = await this.transactions.findOne({ where: { reference } });
    if (!txn || txn.type !== TransactionType.RIDE_PAYOUT) return;
    if (txn.status !== TransactionStatus.PENDING) return;
    const status = await this.provider.verifyTransfer(reference);
    if (status === 'success') {
      await this.transactions.update({ reference }, { status: TransactionStatus.SUCCESS });
    } else if (status === 'failed') {
      await this.reversePayout(txn);
    }
  }

  /** Compensating entry that returns reserved payout funds to the driver. */
  private async reversePayout(txn: Transaction): Promise<void> {
    if (!txn.userId) return;
    const wallet = await this.ledger.getOrCreateUserWallet(txn.userId);
    const gateway = await this.ledger.systemWallet(SystemAccount.GATEWAY);
    await this.ledger.post({
      type: TransactionType.REFUND,
      reference: `payout_rev_${txn.reference}`,
      amount: txn.amount,
      legs: [
        { walletId: gateway.id, direction: LedgerDirection.DEBIT, amount: txn.amount },
        { walletId: wallet.id, direction: LedgerDirection.CREDIT, amount: txn.amount },
      ],
      userId: txn.userId,
      metadata: { reversalOf: txn.reference },
    });
    await this.transactions.update({ reference: txn.reference }, { status: TransactionStatus.FAILED });
  }

  // ─── driver earnings summary ──────────────────────────────────────────────────
  async earnings(driverId: string) {
    const wallet = await this.ledger.getOrCreateUserWallet(driverId);
    const entries = await this.ledger.history(wallet.id, 500);
    const sumOf = (pred: (t: TransactionType, d: LedgerDirection) => boolean) =>
      entries.filter((e) => pred(e.type, e.direction)).reduce((s, e) => s + e.amount, 0);

    const grossEarnings = sumOf((t, d) => t === TransactionType.RIDE_CHARGE && d === LedgerDirection.CREDIT);
    const commissionPaid = sumOf((t, d) => t === TransactionType.COMMISSION && d === LedgerDirection.DEBIT);
    const penalties = sumOf((t, d) => t === TransactionType.PENALTY && d === LedgerDirection.DEBIT);
    const bonuses = sumOf((t, d) => t === TransactionType.PENALTY && d === LedgerDirection.CREDIT);
    const paidOut = sumOf((t, d) => t === TransactionType.RIDE_PAYOUT && d === LedgerDirection.DEBIT);

    return {
      balanceKobo: wallet.balance,
      balance: wallet.balance / 100,
      grossEarningsKobo: grossEarnings,
      grossEarnings: grossEarnings / 100,
      commissionPaidKobo: commissionPaid,
      commissionPaid: commissionPaid / 100,
      penaltiesKobo: penalties,
      penalties: penalties / 100,
      cancellationCompensationKobo: bonuses,
      cancellationCompensation: bonuses / 100,
      paidOutKobo: paidOut,
      paidOut: paidOut / 100,
    };
  }

  // ─── gateway webhook ──────────────────────────────────────────────────────────
  async handleWebhook(rawBody: string, signature: string) {
    if (!this.provider.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException('invalid webhook signature');
    }
    let evt: { event?: string; data?: { reference?: string } };
    try {
      evt = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('invalid webhook body');
    }
    const reference = evt.data?.reference;
    if (!reference) return { ok: true, ignored: true as const };

    if (evt.event === 'charge.success') {
      await this.confirmTopup(reference);
    } else if (evt.event?.startsWith('transfer.')) {
      await this.confirmPayout(reference);
    }
    return { ok: true };
  }

  // ─── helpers ──────────────────────────────────────────────────────────────────
  private shape(t: Transaction) {
    return {
      reference: t.reference,
      type: t.type,
      status: t.status,
      amountKobo: t.amount,
      amount: t.amount / 100,
      rideId: t.rideId,
      provider: t.provider,
      providerRef: t.providerRef,
      createdAt: t.createdAt,
    };
  }
}
