import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverModule } from '../driver/driver.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Ride } from '../rides/entities/ride.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { PanicEvent } from './entities/panic-event.entity';
import { SharedTrip } from './entities/shared-trip.entity';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { SharedTripController, TripShareController } from './trip-share.controller';

/**
 * Phase 6 — Safety. Emergency contacts, panic alerts (fan out to contacts + ops
 * via Notifications), and revocable public share-trip links. Reads the Ride repo
 * for participant checks + the shared read-only view.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EmergencyContact, PanicEvent, SharedTrip, Ride]),
    NotificationsModule,
    DriverModule,
    RealtimeModule,
  ],
  controllers: [SafetyController, TripShareController, SharedTripController],
  providers: [SafetyService],
})
export class SafetyModule {}
