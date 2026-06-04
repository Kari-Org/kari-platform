import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { DriverController } from './driver.controller';
import { DriverOnboardingService } from './driver-onboarding.service';
import { DriverService } from './driver.service';
import { DriverProfile } from './entities/driver-profile.entity';
import { Vehicle } from './entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DriverProfile, Vehicle]), IdentityModule],
  controllers: [DriverController],
  providers: [DriverService, DriverOnboardingService],
  exports: [DriverService],
})
export class DriverModule {}
