import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoneyModule } from '../money/money.module';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Phase 4 — Subscriptions. Prepaid plans charged via the ledger + a sticky
 * driver for the same-driver guarantee. Exports SubscriptionsService so
 * RidesService can route subscribers to their assigned driver and record it.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), MoneyModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
