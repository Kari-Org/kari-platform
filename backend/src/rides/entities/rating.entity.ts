import { Column, Entity, Index } from 'typeorm';
import { UserRole } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A mutual rating left after a completed ride. */
@Entity('ratings')
export class Rating extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  rideId: string;

  @Column({ type: 'uuid' })
  raterId: string;

  @Index()
  @Column({ type: 'uuid' })
  rateeId: string;

  @Column({ type: 'varchar', length: 16 })
  raterRole: UserRole;

  @Column({ type: 'int' })
  stars: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
