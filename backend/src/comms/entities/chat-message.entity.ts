import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/** A persisted in-ride chat message between the two ride participants. */
@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  rideId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'uuid' })
  recipientId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
