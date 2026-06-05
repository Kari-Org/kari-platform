import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** A public, revocable, expiring link that exposes a ride's live status read-only. */
@Entity('shared_trips')
export class SharedTrip extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  rideId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
