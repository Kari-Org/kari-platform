import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverModule } from '../driver/driver.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RiderModule } from '../rider/rider.module';
import { AvailabilityController } from './availability.controller';
import { Rating } from './entities/rating.entity';
import { RideOffer } from './entities/ride-offer.entity';
import { Ride } from './entities/ride.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { MoneyModule } from '../money/money.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MatchingService } from './matching.service';
import { PricingService } from './pricing.service';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideOffer, Rating]),
    DriverModule,
    RiderModule,
    RealtimeModule,
    MoneyModule,
    GamificationModule,
    ReferralsModule,
    SubscriptionsModule,
  ],
  controllers: [RidesController, AvailabilityController],
  providers: [PricingService, MatchingService, RidesService],
  exports: [PricingService, MatchingService],
})
export class RidesModule {}
