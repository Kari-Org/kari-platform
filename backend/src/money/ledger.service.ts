import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, Repository } from 'typeorm';
import {
  LedgerDirection,
  type PaymentMethod,
  SystemAccount,
  TransactionStatus,
  type TransactionType,
  WalletOwnerType,
} from '@kari/types';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';

/** One leg of a balanced posting. `amount` is always positive kobo. */
export interface PostLeg {
  walletId: string;
  direction: LedgerDirection;
  amount: number;
}

export interface PostArgs {
  type: TransactionType;
  /** Idempotency key. Posting the same reference twice is a no-op (returns the first). */
  reference: string;
  legs: PostLeg[];
  /** Total transaction amount (kobo). Defaults to the summed debit side. */
  amount?: number;
  userId?: string | null;
  rideId?: string | null;
  paymentMethod?: PaymentMethod | null;
  provider?: string | null;
  providerRef?: string | null;
  status?: TransactionStatus;
  metadata?: Record<string, unknown> | null;
}

/**
 * The double-entry engine. Every balance change goes through {@link post}, which
 * runs inside a single DB transaction: it asserts the legs balance, locks each
 * touched wallet row (pessimistic, in a deterministic order to avoid deadlocks),
 * applies the deltas, snapshots `balanceAfter`, and writes the immutable entries.
 * Wallet balances are a cached projection — never mutate them anywhere else.
 *
 * Global invariant: the sum of every wallet balance is always exactly zero.
 * Money entering from the gateway drives the GATEWAY system wallet negative
 * (its balance = net funds currently held in user wallets); payouts unwind it.
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger('LedgerService');

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(LedgerEntry) private readonly entries: Repository<LedgerEntry>,
  ) {}

  // ─── wallet resolution ──────────────────────────────────────────────────────
  async getOrCreateUserWallet(userId: string): Promise<Wallet> {
    const found = await this.wallets.findOne({
      where: { ownerId: userId, ownerType: WalletOwnerType.USER },
    });
    if (found) return found;
    try {
      return await this.wallets.save(
        this.wallets.create({ ownerType: WalletOwnerType.USER, ownerId: userId }),
      );
    } catch {
      // Lost a create race against the unique(ownerId) index — refetch the winner.
      const again = await this.wallets.findOne({ where: { ownerId: userId } });
      if (again) return again;
      throw new Error(`could not resolve wallet for user ${userId}`);
    }
  }

  async systemWallet(key: SystemAccount): Promise<Wallet> {
    const found = await this.wallets.findOne({
      where: { systemKey: key, ownerType: WalletOwnerType.SYSTEM },
    });
    if (found) return found;
    try {
      return await this.wallets.save(
        this.wallets.create({ ownerType: WalletOwnerType.SYSTEM, ownerId: null, systemKey: key }),
      );
    } catch {
      const again = await this.wallets.findOne({ where: { systemKey: key } });
      if (again) return again;
      throw new Error(`could not resolve system wallet ${key}`);
    }
  }

  // ─── posting ─────────────────────────────────────────────────────────────────
  private assertBalanced(legs: PostLeg[]): void {
    if (legs.length < 2) {
      throw new Error('a ledger transaction needs at least two legs');
    }
    if (legs.some((l) => !Number.isInteger(l.amount) || l.amount <= 0)) {
      throw new Error('every leg amount must be a positive integer (kobo)');
    }
    const debit = legs
      .filter((l) => l.direction === LedgerDirection.DEBIT)
      .reduce((s, l) => s + l.amount, 0);
    const credit = legs
      .filter((l) => l.direction === LedgerDirection.CREDIT)
      .reduce((s, l) => s + l.amount, 0);
    if (debit !== credit) {
      throw new Error(`unbalanced transaction: debit ${debit} != credit ${credit}`);
    }
  }

  private sumDebits(legs: PostLeg[]): number {
    return legs
      .filter((l) => l.direction === LedgerDirection.DEBIT)
      .reduce((s, l) => s + l.amount, 0);
  }

  /** Locks each wallet (stable order), applies the delta, writes the immutable entry. */
  private async applyLegs(
    m: EntityManager,
    txnId: string,
    type: TransactionType,
    legs: PostLeg[],
  ): Promise<void> {
    const ordered = [...legs].sort((a, b) => a.walletId.localeCompare(b.walletId));
    for (const leg of ordered) {
      const wallet = await m.findOne(Wallet, {
        where: { id: leg.walletId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new Error(`wallet ${leg.walletId} not found`);
      const delta = leg.direction === LedgerDirection.CREDIT ? leg.amount : -leg.amount;
      wallet.balance += delta;
      await m.save(wallet);
      await m.save(
        m.create(LedgerEntry, {
          transactionId: txnId,
          walletId: wallet.id,
          direction: leg.direction,
          amount: leg.amount,
          balanceAfter: wallet.balance,
          type,
        }),
      );
    }
  }

  /** Create a new transaction and post its balanced legs atomically. Idempotent by reference. */
  async post(args: PostArgs): Promise<Transaction> {
    this.assertBalanced(args.legs);
    return this.dataSource.transaction(async (m) => {
      const existing = await m.findOne(Transaction, { where: { reference: args.reference } });
      if (existing) {
        this.logger.warn(`post ${args.reference} already exists (${existing.status}) — no-op`);
        return existing;
      }
      const txn = await m.save(
        m.create(Transaction, {
          type: args.type,
          status: args.status ?? TransactionStatus.SUCCESS,
          reference: args.reference,
          amount: args.amount ?? this.sumDebits(args.legs),
          userId: args.userId ?? null,
          rideId: args.rideId ?? null,
          paymentMethod: args.paymentMethod ?? null,
          provider: args.provider ?? null,
          providerRef: args.providerRef ?? null,
          metadata: args.metadata ?? null,
        }),
      );
      await this.applyLegs(m, txn.id, args.type, args.legs);
      return txn;
    });
  }

  /**
   * Post balanced legs onto an existing PENDING transaction (e.g. a top-up the
   * gateway has now confirmed), flipping it to SUCCESS. Idempotent: a
   * transaction already SUCCESS is returned untouched (no double-credit).
   */
  async settlePending(
    reference: string,
    legs: PostLeg[],
    patch?: Partial<Transaction>,
  ): Promise<Transaction> {
    this.assertBalanced(legs);
    return this.dataSource.transaction(async (m) => {
      const txn = await m.findOne(Transaction, { where: { reference } });
      if (!txn) throw new Error(`no transaction found for reference ${reference}`);
      if (txn.status === TransactionStatus.SUCCESS) return txn;
      await this.applyLegs(m, txn.id, txn.type, legs);
      txn.status = TransactionStatus.SUCCESS;
      if (patch) Object.assign(txn, patch);
      return m.save(txn);
    });
  }

  // ─── reads ─────────────────────────────────────────────────────────────────
  async balanceOf(walletId: string): Promise<number> {
    const w = await this.wallets.findOne({ where: { id: walletId } });
    return w?.balance ?? 0;
  }

  async userBalance(userId: string): Promise<number> {
    return (await this.getOrCreateUserWallet(userId)).balance;
  }

  async history(walletId: string, limit = 50): Promise<LedgerEntry[]> {
    return this.entries.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async transactionByReference(reference: string): Promise<Transaction | null> {
    return this.transactions.findOne({ where: { reference } });
  }

  /**
   * Sum of every wallet balance. Double-entry guarantees this is exactly zero;
   * any non-zero result means money was created or destroyed (a bug). Used by
   * the E2E to assert the books balance.
   */
  async totalImbalance(): Promise<number> {
    const all = await this.wallets.find();
    return all.reduce((s, w) => s + w.balance, 0);
  }
}
