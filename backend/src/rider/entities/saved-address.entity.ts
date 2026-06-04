import { Column, Entity, ManyToOne } from 'typeorm';
import { AddressLabel } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { RiderProfile } from './rider-profile.entity';

@Entity('saved_addresses')
export class SavedAddress extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  label: AddressLabel;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @ManyToOne(() => RiderProfile, (rider) => rider.addresses, { onDelete: 'CASCADE' })
  rider: RiderProfile;
}
