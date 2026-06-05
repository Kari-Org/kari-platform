import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoneyModule } from '../money/money.module';
import { ShuttleBooking } from './entities/shuttle-booking.entity';
import { ShuttleRoute } from './entities/shuttle-route.entity';
import { ShuttleStop } from './entities/shuttle-stop.entity';
import { ShuttleTrip } from './entities/shuttle-trip.entity';
import { ShuttleController } from './shuttle.controller';
import { ShuttleService } from './shuttle.service';

/**
 * Phase 5 — Shuttle. Fixed routes + ordered stops + scheduled trips (seeded on
 * boot). Riders book seats between stops, charged from the wallet via the
 * ledger (MoneyModule); seat inventory is optimistic-locked.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ShuttleRoute, ShuttleStop, ShuttleTrip, ShuttleBooking]),
    MoneyModule,
  ],
  controllers: [ShuttleController],
  providers: [ShuttleService],
})
export class ShuttleModule {}
