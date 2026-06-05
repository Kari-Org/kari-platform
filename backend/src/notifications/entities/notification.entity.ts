import { Column, Entity, Index } from 'typeorm';
import { NotificationChannel } from '@kari/types';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * An in-app notification (the durable "notification center" record). The same
 * row drives external fan-out (push/SMS/email) via the BullMQ worker; `channels`
 * lists which were requested.
 */
@Entity('notifications')
export class Notification extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  /** Requested delivery channels (NotificationChannel values). */
  @Column({ type: 'simple-array', nullable: true })
  channels: NotificationChannel[] | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  read: boolean;
}
