import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeModule } from '../realtime/realtime.module';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { CommsController } from './comms.controller';
import { CommsService } from './comms.service';
import { ChatMessage } from './entities/chat-message.entity';

/**
 * Phase 6 — Communication. Persisted in-ride chat (delivered over the socket)
 * and masked voice calls (VoiceProvider). Both gated to ride participants.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, Ride, User]), RealtimeModule],
  controllers: [CommsController],
  providers: [CommsService],
})
export class CommsModule {}
