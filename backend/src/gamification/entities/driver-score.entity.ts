import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * A driver's points + ride count within a scoring period. One row per
 * (driver, periodKey): an ISO-week key like `2026-W23` for the weekly
 * leaderboard, plus a special `ALL` row holding all-time totals (drives
 * milestone achievements). Unique per (driver, period).
 */
@Entity('driver_scores')
@Index(['driverId', 'periodKey'], { unique: true })
export class DriverScore extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  driverId: string;

  @Index()
  @Column({ type: 'varchar', length: 12 })
  periodKey: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 0 })
  rides: number;
}
