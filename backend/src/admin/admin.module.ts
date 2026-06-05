import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DriverModule } from '../driver/driver.module';
import { DriverProfile } from '../driver/entities/driver-profile.entity';
import { MoneyModule } from '../money/money.module';
import { Transaction } from '../money/entities/transaction.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { RiderProfile } from '../rider/entities/rider-profile.entity';
import { Ride } from '../rides/entities/ride.entity';
import { RidesModule } from '../rides/rides.module';
import { TicketsModule } from '../tickets/tickets.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit/audit.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditLog } from './audit/entities/audit-log.entity';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    DriverModule,
    RidesModule,
    RealtimeModule,
    MoneyModule,
    TicketsModule,
    TypeOrmModule.forFeature([User, Ride, RiderProfile, DriverProfile, AuditLog, Transaction]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditService, AuditInterceptor],
})
export class AdminModule {}
