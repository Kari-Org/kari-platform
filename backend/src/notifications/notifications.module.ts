import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

/**
 * Phase 6 — Notifications. In-app notification center + asynchronous fan-out to
 * push/SMS/email via the BullMQ `notifications` queue + worker. Exported so
 * Safety (panic alerts) and other modules can trigger notifications.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeviceToken, User]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
