import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { CarCategory, PaymentMethod, PriceType, RideStatus, RideType } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/** A single ride through its lifecycle. Prices are whole naira (int). */
@Entity('rides')
export class Ride extends BaseEntity {
  @Column({ type: 'varchar', length: 16, default: RideType.SOLO })
  type: RideType;

  @Index()
  @Column({ type: 'varchar', length: 16, default: RideStatus.SEARCHING })
  status: RideStatus;

  @Index()
  @Column({ type: 'uuid' })
  riderId: string;

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

  @Column({ type: 'varchar', length: 16, default: PriceType.STANDARD })
  priceType: PriceType;

  @Column({ type: 'varchar', length: 16, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  /** Standard metered fare for the chosen category — also the negotiation ceiling. */
  @Column({ type: 'int' })
  quotedPrice: number;

  @Column({ type: 'int', nullable: true })
  riderProposedPrice: number | null;

  @Column({ type: 'int', nullable: true })
  agreedPrice: number | null;

  /** 4-digit ride-start PIN; shown only to the rider, entered by the driver to start. */
  @Column({ type: 'varchar', length: 8, nullable: true })
  startOtp: string | null;

  @Column({ type: 'boolean', default: false })
  riderRated: boolean;

  @Column({ type: 'boolean', default: false })
  driverRated: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  arrivedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancelReason: string | null;

  /** Optimistic-lock guard: concurrent accepts of the same ride — first wins. */
  @VersionColumn()
  version: number;
}
