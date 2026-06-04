import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { DriverAvailability, DriverType, KycStatus, Personality } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { Vehicle } from './vehicle.entity';

/** Driver-specific data, linked 1:1 to a User. Freelance self-onboards; dedicated is admin-managed. */
@Entity('driver_profiles')
export class DriverProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 16, default: DriverType.FREELANCE })
  driverType: DriverType;

  // Personal
  @Column({ type: 'varchar', length: 80, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  lastName: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  origin: string | null;

  // Personality (from onboarding quiz) — also a ride-matching dimension
  @Column({ type: 'varchar', length: 16, nullable: true })
  personality: Personality | null;

  // KYC
  @Column({ type: 'varchar', length: 32, nullable: true })
  nin: string | null;

  @Column({ type: 'varchar', length: 16, default: KycStatus.NOT_STARTED })
  ninStatus: KycStatus;

  @Column({ type: 'boolean', default: false })
  livenessVerified: boolean;

  // Payment (payout destination)
  @Column({ type: 'varchar', length: 32, nullable: true })
  bankAccountNumber: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  bankAccountName: string | null;

  // Next of kin
  @Column({ type: 'varchar', length: 120, nullable: true })
  nokName: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  nokPhone: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  nokRelationship: string | null;

  // Service standards (requirement: music apps installed)
  @Column({ type: 'boolean', default: false })
  spotifyInstalled: boolean;

  @Column({ type: 'boolean', default: false })
  appleMusicInstalled: boolean;

  // Status
  @Column({ type: 'varchar', length: 16, default: DriverAvailability.OFFLINE })
  availability: DriverAvailability;

  @Column({ type: 'boolean', default: false })
  onboardingComplete: boolean;

  @Column({ type: 'real', default: 0 })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.driver, {
    nullable: true,
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  vehicle: Vehicle | null;
}
