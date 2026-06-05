import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { NotificationChannel } from '@kari/types';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';

export interface NotifyInput {
  type: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
}

const JOB_OPTS = { removeOnComplete: true, removeOnFail: 50, attempts: 3, backoff: { type: 'fixed', delay: 1000 } } as const;

/**
 * Notifications. The in-app row is persisted synchronously (so it's instantly
 * listable); external channels (push/SMS/email) fan out asynchronously via the
 * BullMQ `notifications` queue + worker.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly queue: Queue,
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(DeviceToken) private readonly devices: Repository<DeviceToken>,
  ) {}

  async registerDevice(userId: string, token: string, platform: string) {
    const existing = await this.devices.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      return this.devices.save(existing);
    }
    return this.devices.save(this.devices.create({ userId, token, platform }));
  }

  /** Persist the in-app notification + enqueue external delivery. */
  async notify(userId: string, input: NotifyInput): Promise<Notification> {
    const channels = input.channels ?? [NotificationChannel.PUSH, NotificationChannel.IN_APP];
    const row = await this.notifications.save(
      this.notifications.create({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
        channels,
        read: false,
      }),
    );
    await this.queue.add('deliver', { notificationId: row.id }, JOB_OPTS);
    return row;
  }

  /** Send a raw SMS to an arbitrary number (e.g. an emergency contact, not a user). */
  async sendSms(phone: string, message: string): Promise<void> {
    await this.queue.add('sms', { phone, message }, JOB_OPTS);
  }

  list(userId: string, limit = 50) {
    return this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }

  async markRead(userId: string, id: string) {
    const n = await this.notifications.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('notification not found');
    n.read = true;
    return this.notifications.save(n);
  }
}
