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

  @Column({ type: 'varchar', length: 32 })
  planId: string;

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
