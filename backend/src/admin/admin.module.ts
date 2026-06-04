import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DriverModule } from '../driver/driver.module';
import { DriverProfile } from '../driver/entities/driver-profile.entity';
import { RiderProfile } from '../rider/entities/rider-profile.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    DriverModule,
    TypeOrmModule.forFeature([User, Ride, RiderProfile, DriverProfile]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
