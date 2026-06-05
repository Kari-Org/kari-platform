import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { APP_CONFIG, type AppConfig, ConfigModule } from './config/config.module';
import { LoggerModule } from './common/logger/logger.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { ProvidersModule } from './providers/providers.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RealtimeModule } from './realtime/realtime.module';
import { IdentityModule } from './identity/identity.module';
import { DriverModule } from './driver/driver.module';
import { RiderModule } from './rider/rider.module';
import { AdminModule } from './admin/admin.module';
import { RidesModule } from './rides/rides.module';
import { PlacesModule } from './places/places.module';
import { MoneyModule } from './money/money.module';
import { GamificationModule } from './gamification/gamification.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ ttl: config.throttle.ttl * 1000, limit: config.throttle.limit }],
      }),
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    ProvidersModule,
    AuthModule,
    RealtimeModule,
    IdentityModule,
    DriverModule,
    RiderModule,
    AdminModule,
    RidesModule,
    PlacesModule,
    MoneyModule,
    GamificationModule,
    ReferralsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: envelope wraps successful responses; filter normalizes errors.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    // Global auth: every route requires a JWT unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
