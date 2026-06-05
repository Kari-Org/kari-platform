import { Column, Entity, Index } from 'typeorm';
import { PaymentMethod, TransactionStatus, TransactionType } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { bigintNumber } from '../../common/transformers/numeric.transformer';

/**
 * A money event that groups two or more {@link LedgerEntry} legs (whose debits
 * and credits net to zero). `reference` is the idempotency key — the same
 * reference is never posted twice — and doubles as the gateway reference for
 * top-ups and payouts.
 */
@Entity('transactions')
export class Transaction extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 24 })
  type: TransactionType;

  @Index()
  @Column({ type: 'varchar', length: 16, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  /** Idempotency key; unique. Also the gateway reference for top-ups/payouts. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  reference: string;

  /** Total amount moved, in kobo (one side of the balanced legs). */
  @Column({ type: 'bigint', default: 0, transformer: bigintNumber })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string;

  /** The user this transaction concerns (rider for charge/top-up, driver for payout/earning). */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  rideId: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  paymentMethod: PaymentMethod | null;

  /** Gateway provider name (paystack / noop). */
  @Column({ type: 'varchar', length: 24, nullable: true })
  provider: string | null;

  /** Provider-side reference (Paystack transaction/transfer ref). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  providerRef: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
