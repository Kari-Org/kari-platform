import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { redisConnectionFromUrl } from '../redis/redis.util';

/**
 * BullMQ root. Feature modules register their own queues with
 * `BullModule.registerQueue(...)`. Used for OTP expiry, notification fan-out,
 * commission recompute, leaderboard rollups, and subscription billing.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        connection: {
          ...redisConnectionFromUrl(config.redis.url),
          maxRetriesPerRequest: null,
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
