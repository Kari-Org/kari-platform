import { Column, Entity, OneToOne } from 'typeorm';
import { CarCategory } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { DriverProfile } from './driver-profile.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column({ type: 'varchar', length: 60, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 60 })
  model: string;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 20 })
  plateNumber: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 16, default: CarCategory.ECONOMY })
  category: CarCategory;

  @OneToOne(() => DriverProfile, (driver) => driver.vehicle)
  driver: DriverProfile;
}
