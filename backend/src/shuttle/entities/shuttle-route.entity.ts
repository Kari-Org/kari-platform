import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** A fixed shuttle route (e.g. a Lekki or Aba corridor). */
@Entity('shuttle_routes')
export class ShuttleRoute extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  name: string;

  /** Corridor label, e.g. LEKKI / ABA. */
  @Column({ type: 'varchar', length: 24 })
  corridor: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // Ops assignment (spec 0002): dedicated driver + bus for this route
  @Column({ type: 'uuid', nullable: true })
  assignedDriverId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  busPlateNumber: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  busLabel: string | null;
}
