import { Column, Entity, Index } from 'typeorm';
import { DocumentType, KycStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A KYC/onboarding document stored in object storage (S3), referenced by URL. */
@Entity('documents')
export class Document extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  type: DocumentType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 16, default: KycStatus.SUBMITTED })
  status: KycStatus;
}
