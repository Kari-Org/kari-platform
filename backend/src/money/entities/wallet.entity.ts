import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { SystemAccount, WalletOwnerType } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { bigintNumber } from '../../common/transformers/numeric.transformer';

/**
 * A money container. Every user gets exactly one wallet; the platform holds a
 * small set of singleton system wallets (see {@link SystemAccount}). Balances
 * are **kobo** (minor units) and are a cached projection of the ledger — they
 * are only ever mutated inside the same DB transaction that posts the entries,
 * under an optimistic lock. Never mutate a balance outside the ledger.
 */
@Entity('wallets')
export class Wallet extends BaseEntity {
  @Column({ type: 'varchar', length: 16, default: WalletOwnerType.USER })
  ownerType: WalletOwnerType;

  /** The owning user for USER wallets; null for SYSTEM wallets. Unique per user. */
  @Index({ unique: true })
  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  /** Stable key for SYSTEM wallets (REVENUE/GATEWAY); null for user wallets. Unique per account. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 24, nullable: true })
  systemKey: SystemAccount | null;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string;

  /** Cached ledger projection, in kobo. Maintained transactionally with the entries. */
  @Column({ type: 'bigint', default: 0, transformer: bigintNumber })
  balance: number;

  /** Optimistic-lock guard for concurrent debits/credits — retry on mismatch. */
  @VersionColumn()
  version: number;
}
