import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { ShuttleTripStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A scheduled run of a route at a given departure time, with seat inventory. */
@Entity('shuttle_trips')
export class ShuttleTrip extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  routeId: string;

  @Column({ type: 'timestamptz' })
  departAt: Date;

  @Column({ type: 'int', default: 14 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  seatsBooked: number;

  @Column({ type: 'uuid', nullable: true })
  driverId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: ShuttleTripStatus.SCHEDULED })
  status: ShuttleTripStatus;

  /** Optimistic-lock guard so concurrent bookings can't oversell seats. */
  @VersionColumn()
  version: number;
}
