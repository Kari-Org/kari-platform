import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import type { Redis } from 'ioredis';
import { OtpChannel, type OtpPurpose } from '@kari/types';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import {
  SMS_PROVIDER,
  WHATSAPP_PROVIDER,
  type SmsProvider,
  type WhatsAppProvider,
} from '../../providers/contracts';

const OTP_TTL_SECONDS = 300;

export interface OtpSendResult {
  channel: OtpChannel;
  expiresInSeconds: number;
}

/**
 * One-time passwords for phone verification. Codes are hashed (never stored in
 * cleartext) in Redis with a 5-minute TTL, and delivered via the SMS or
 * WhatsApp provider. In dev the no-op providers log the code so flows are testable.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsAppProvider,
  ) {}

  private key(purpose: OtpPurpose, phone: string): string {
    return `otp:${purpose}:${phone}`;
  }

  private digest(code: string, phone: string): string {
    return createHash('sha256').update(`${code}:${phone}`).digest('hex');
  }

  async send(
    phone: string,
    purpose: OtpPurpose,
    channel: OtpChannel = OtpChannel.SMS,
  ): Promise<OtpSendResult> {
    const code = String(randomInt(1000, 10000));
    await this.redis.set(this.key(purpose, phone), this.digest(code, phone), 'EX', OTP_TTL_SECONDS);

    const message = `Your Kari code is ${code}. It expires in 5 minutes.`;
    if (channel === OtpChannel.WHATSAPP) {
      await this.whatsapp.sendWhatsApp({ to: phone, message });
    } else {
      await this.sms.sendSms({ to: phone, message });
    }

    this.logger.debug(`OTP for ${purpose} sent to ${phone} via ${channel}`);
    return { channel, expiresInSeconds: OTP_TTL_SECONDS };
  }

  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const k = this.key(purpose, phone);
    const stored = await this.redis.get(k);
    if (!stored) {
      return false;
    }
    const ok = stored === this.digest(code, phone);
    if (ok) {
      await this.redis.del(k);
    }
    return ok;
  }
}
