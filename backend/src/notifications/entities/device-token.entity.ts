import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** A registered push token for a user's device. Unique per token. */
@Entity('device_tokens')
export class DeviceToken extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  token: string;

  /** ios / android / web. */
  @Column({ type: 'varchar', length: 16, default: 'unknown' })
  platform: string;
}
