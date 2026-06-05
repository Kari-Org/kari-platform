import { Column, Entity, Index } from 'typeorm';
import { PanicStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A panic/SOS alert raised by a user, optionally during a ride. */
@Entity('panic_events')
export class PanicEvent extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  rideId: string | null;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Index()
  @Column({ type: 'varchar', length: 16, default: PanicStatus.OPEN })
  status: PanicStatus;

  @Column({ type: 'int', default: 0 })
  contactsAlerted: number;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
