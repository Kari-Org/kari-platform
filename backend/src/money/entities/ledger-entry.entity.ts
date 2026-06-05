import { Column, Entity, Index } from 'typeorm';
import { LedgerDirection, TransactionType } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { bigintNumber } from '../../common/transformers/numeric.transformer';

/**
 * One leg of a double-entry {@link Transaction}: a single debit or credit
 * against one wallet. Amounts are always positive kobo — the sign is carried by
 * `direction`. `balanceAfter` snapshots the wallet balance immediately after
 * this leg, so the ledger is independently auditable without replaying.
 */
@Entity('ledger_entries')
export class LedgerEntry extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  transactionId: string;

  @Index()
  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'varchar', length: 8 })
  direction: LedgerDirection;

  /** Always positive, in kobo. Direction carries the sign. */
  @Column({ type: 'bigint', transformer: bigintNumber })
  amount: number;

  /** Wallet balance immediately after applying this leg (kobo) — audit snapshot. */
  @Column({ type: 'bigint', transformer: bigintNumber })
  balanceAfter: number;

  /** Denormalised transaction type for fast per-wallet history filtering. */
  @Index()
  @Column({ type: 'varchar', length: 24 })
  type: TransactionType;
}
