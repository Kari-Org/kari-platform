import { Column, Entity, Index } from 'typeorm';
import { AchievementBadge } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A badge a driver has unlocked. Unique per (driver, badge) — unlocked once. */
@Entity('achievements')
@Index(['driverId', 'badge'], { unique: true })
export class Achievement extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'varchar', length: 24 })
  badge: AchievementBadge;
}
