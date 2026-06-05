import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { NotificationChannel } from '@kari/types';
import {
  EMAIL_PROVIDER,
  type EmailProvider,
  PUSH_PROVIDER,
  type PushProvider,
  SMS_PROVIDER,
  type SmsProvider,
} from '../providers/contracts';
import { User } from '../users/entities/user.entity';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';

/**
 * Worker for the `notifications` queue. `deliver` jobs fan a persisted
 * notification out to the user's push/SMS/email channels; `sms` jobs send a raw
 * SMS to an arbitrary number (emergency contacts). All delivery is best-effort.
 */
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(DeviceToken) private readonly devices: Repository<DeviceToken>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'sms') {
      const { phone, message } = job.data as { phone: string; message: string };
      await this.sms.sendSms({ to: phone, message });
      return;
    }
    if (job.name === 'deliver') {
      const { notificationId } = job.data as { notificationId: string };
      const n = await this.notifications.findOne({ where: { id: notificationId } });
      if (!n) return;
      const channels = n.channels ?? [];
      const user = await this.users.findOne({ where: { id: n.userId } });

      if (channels.includes(NotificationChannel.PUSH)) {
        const tokens = await this.devices.find({ where: { userId: n.userId } });
        for (const t of tokens) {
          await this.push.send({ to: t.token, title: n.title, body: n.body, data: n.data ?? undefined });
        }
      }
      if (channels.includes(NotificationChannel.SMS) && user?.phone) {
        await this.sms.sendSms({ to: user.phone, message: `${n.title}: ${n.body}` });
      }
      if (channels.includes(NotificationChannel.EMAIL) && user?.email) {
        await this.email.sendEmail({ to: user.email, subject: n.title, body: n.body });
      }
    }
  }
}
