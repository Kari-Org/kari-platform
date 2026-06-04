import { Column, Entity, Index } from 'typeorm';
import { AdminRole, UserRole, UserStatus } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * Single identity record. Role-specific data (driver/rider profiles) lives in
 * separate entities linked by userId — one identity, role-scoped profiles.
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  role: UserRole;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 32, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  /** Sub-role for ADMIN users (null for riders/drivers) — drives the admin RBAC. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  adminRole: AdminRole | null;
}
