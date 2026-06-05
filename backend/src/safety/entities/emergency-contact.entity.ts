import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** Someone a user wants alerted if they trigger a panic. */
@Entity('emergency_contacts')
export class EmergencyContact extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  relationship: string | null;
}
