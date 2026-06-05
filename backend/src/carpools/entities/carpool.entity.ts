import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { CarCategory, CarpoolStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * A shared ride that several NIN-verified riders split. Forms up while OPEN,
 * gets a driver (MATCHED), then settles the fare across members on completion.
 * `totalFare` is the whole-trip fare (whole naira); each member's share is
 * `totalFare / member-count`, recomputed as people join or leave.
 */
@Entity('carpools')
export class Carpool extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  creatorId: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: CarpoolStatus.OPEN })
  status: CarpoolStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  driverId: string | null;

  @Column({ type: 'double precision' })
  pickupLat: number;

  @Column({ type: 'double precision' })
  pickupLng: number;

  @Column({ type: 'text', nullable: true })
  pickupAddress: string | null;

  @Column({ type: 'double precision' })
  dropoffLat: number;

  @Column({ type: 'double precision' })
  dropoffLng: number;

  @Column({ type: 'text', nullable: true })
  dropoffAddress: string | null;

  @Column({ type: 'int' })
  distanceMeters: number;

  @Column({ type: 'int' })
  durationSeconds: number;

  @Column({ type: 'varchar', length: 16 })
  carCategory: CarCategory;

  /** Whole-trip fare in naira; split across members. */
  @Column({ type: 'int' })
  totalFare: number;

  @Column({ type: 'int', default: 4 })
  maxSeats: number;

  /** Count of currently-joined members (one member = one seat). */
  @Column({ type: 'int', default: 0 })
  seatsTaken: number;

  @Column({ type: 'timestamptz', nullable: true })
  departAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  /** Optimistic-lock guard so two riders can't claim the last seat at once. */
  @VersionColumn()
  version: number;
}
