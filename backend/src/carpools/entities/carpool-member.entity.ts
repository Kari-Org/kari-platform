import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** A rider's membership in a carpool. Unique per (carpool, rider). */
@Entity('carpool_members')
@Index(['carpoolId', 'riderId'], { unique: true })
export class CarpoolMember extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  carpoolId: string;

  @Index()
  @Column({ type: 'uuid' })
  riderId: string;

  /** This member's current split of the total fare, in naira. */
  @Column({ type: 'int', default: 0 })
  shareAmount: number;

  /** 'JOINED' while active, 'LEFT' once they drop out. */
  @Column({ type: 'varchar', length: 16, default: 'JOINED' })
  status: string;

  @Column({ type: 'boolean', default: false })
  isCreator: boolean;
}
