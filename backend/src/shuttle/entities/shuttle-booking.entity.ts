import { Column, Entity, Index } from 'typeorm';
import { ShuttleBookingStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A rider's seat reservation on a shuttle trip, between two stops. */
@Entity('shuttle_bookings')
export class ShuttleBooking extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tripId: string;

  @Index()
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'uuid' })
  fromStopId: string;

  @Column({ type: 'uuid' })
  toStopId: string;

  @Column({ type: 'int', default: 1 })
  seats: number;

  /** Total fare paid, in naira. */
  @Column({ type: 'int' })
  fare: number;

  @Index()
  @Column({ type: 'varchar', length: 16, default: ShuttleBookingStatus.CONFIRMED })
  status: ShuttleBookingStatus;
}
