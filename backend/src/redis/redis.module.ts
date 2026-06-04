import { Global, Module, type Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { REDIS_CLIENT } from './redis.constants';
import { redisConnectionFromUrl } from './redis.util';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig): Redis =>
    new Redis({
      ...redisConnectionFromUrl(config.redis.url),
      // null = required for any connection BullMQ may reuse; safe for general use
      maxRetriesPerRequest: null,
      lazyConnect: false,
    }),
};

/**
 * Shared Redis client used for ephemeral state: live driver geo-index, price
 * quotes (TTL), OTP state, rate-limit counters. Injected via {@link REDIS_CLIENT}.
 */
@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
