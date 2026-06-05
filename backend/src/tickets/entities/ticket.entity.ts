import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketCategory {
  GENERAL = 'GENERAL',
  PAYMENT = 'PAYMENT',
  SAFETY = 'SAFETY',
  RIDE = 'RIDE',
  ACCOUNT = 'ACCOUNT',
}

/** A support ticket submitted by a rider or driver, triaged by admins. */
@Entity('support_tickets')
export class SupportTicket extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  requesterId: string;

  @Column({ type: 'varchar', length: 16 })
  requesterRole: string;

  @Column({ type: 'varchar', length: 16, default: TicketCategory.GENERAL })
  category: TicketCategory;

  @Column({ type: 'varchar', length: 140 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'uuid', nullable: true })
  rideId: string | null;

  @Column({ type: 'text', nullable: true })
  adminReply: string | null;

  @Column({ type: 'uuid', nullable: true })
  handledById: string | null;
}
