import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * An immutable record of an admin write action. Written by {@link AuditInterceptor}
 * after any successful handler annotated with `@Audit(action)`. The audit log is
 * append-only — there is no update/delete path.
 */
@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  actorEmail: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  actorRole: string | null;

  @Index()
  @Column({ type: 'varchar', length: 48 })
  action: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  targetId: string | null;

  @Column({ type: 'varchar', length: 8 })
  method: string;

  @Column({ type: 'varchar', length: 200 })
  path: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;
}
