import { Column, Entity, Index } from 'typeorm';
import { DocumentType, KycStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * bigint <-> JS number bridge. TypeORM returns bigint columns as strings to avoid
 * precision loss; document sizes are far under 2^53, so a plain number is safe.
 */
const bigintToNumber = {
  to: (v?: number | null): number | null => v ?? null,
  from: (v?: string | null): number | null => (v == null ? null : Number(v)),
};

/**
 * A KYC/onboarding document. The bytes live in object storage (S3); this row holds
 * the stable object key, and a short-lived signed GET link is generated per read and
 * never persisted (see the S3 storage provider spec 0005).
 */
@Entity('documents')
export class Document extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  type: DocumentType;

  /** Stable object-store key, e.g. `documents/{userId}/{type}-{uuid}`. Never a URL. */
  @Column({ type: 'text' })
  objectKey: string;

  /** Recorded so the signed GET can set the right response content type. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  contentType: string | null;

  /** Recorded upload size in bytes, for audit against the size limit. */
  @Column({ type: 'bigint', nullable: true, transformer: bigintToNumber })
  sizeBytes: number | null;

  @Column({ type: 'varchar', length: 16, default: KycStatus.SUBMITTED })
  status: KycStatus;
}
