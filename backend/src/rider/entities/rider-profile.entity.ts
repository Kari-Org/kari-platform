import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AccessibilityNeed, BehaviorPreference, Gender, KycStatus, MusicPreference } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';
import { SavedAddress } from './saved-address.entity';

/** Rider-specific data, linked 1:1 to a User. Low-friction by design. */
@Entity('rider_profiles')
export class RiderProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  lastName: string | null;

  /** Preferred driver behavior — feeds ride matching. */
  @Column({ type: 'varchar', length: 16, default: BehaviorPreference.NO_PREFERENCE })
  preferredDriverBehavior: BehaviorPreference;

  // NIN — required to join carpools (trust among co-riders)
  @Column({ type: 'varchar', length: 32, nullable: true })
  nin: string | null;

  @Column({ type: 'varchar', length: 16, default: KycStatus.NOT_STARTED })
  ninStatus: KycStatus;

  /** Selfie liveness check (KYC step in onboarding). */
  @Column({ type: 'boolean', default: false })
  livenessVerified: boolean;

  // ─── Additional information ────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 24, nullable: true })
  gender: Gender | null;

  /** Referral code the rider entered at signup (who referred them). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  referralCode: string | null;

  // ─── Ride preferences (onboarding survey) ──────────────────────────────────
  @Column({ type: 'varchar', length: 16, nullable: true })
  musicPreference: MusicPreference | null;

  @Column({ type: 'varchar', length: 16, default: AccessibilityNeed.NONE })
  accessibilityNeed: AccessibilityNeed;

  @Column({ type: 'boolean', default: false })
  promotionsOptIn: boolean;

  /** Free-text home / frequent destination captured during onboarding. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  homeAddress: string | null;

  @Column({ type: 'real', default: 0 })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @OneToMany(() => SavedAddress, (address) => address.rider, { cascade: true, eager: true })
  addresses: SavedAddress[];
}
