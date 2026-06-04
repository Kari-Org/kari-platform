import { Column, Entity, Index } from 'typeorm';
import { NegotiationStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A driver's counter-offer on a negotiable ride. */
@Entity('ride_offers')
export class RideOffer extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  rideId: string;

  @Index()
  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 16, default: NegotiationStatus.PENDING })
  status: NegotiationStatus;
}
