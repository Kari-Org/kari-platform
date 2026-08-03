import { Column, Entity, Index } from 'typeorm';
import { SubscriptionStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * A rider's subscription to a plan. `assignedDriverId` is the sticky driver
 * (set the first time a driver serves this subscriber); matching prefers them
 * while the subscription is ACTIVE.
 */
@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  riderId: string;

  /** Static-catalog plan (v1); null for route-priced subscriptions (spec 0004). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  planId: string | null;

  // Route-priced subscription (spec 0004): the rider's own commute route + fee
  @Column({ type: 'double precision', nullable: true })
  pickupLat: number | null;

  @Column({ type: 'double precision', nullable: true })
  pickupLng: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pickupAddress: string | null;

  @Column({ type: 'double precision', nullable: true })
  dropoffLat: number | null;

  @Column({ type: 'double precision', nullable: true })
  dropoffLng: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  dropoffAddress: string | null;

  @Column({ type: 'int', nullable: true })
  monthlyFeeNaira: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  label: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  /** Sticky driver for the same-driver guarantee; null until first served. */
  @Column({ type: 'uuid', nullable: true })
  assignedDriverId: string | null;

  @Column({ type: 'timestamptz' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd: Date;

  @Column({ type: 'int', default: 0 })
  ridesUsed: number;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;
}
