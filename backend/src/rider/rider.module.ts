import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';
import { RiderProfile } from './entities/rider-profile.entity';
import { SavedAddress } from './entities/saved-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RiderProfile, SavedAddress]), IdentityModule],
  controllers: [RiderController],
  providers: [RiderService],
  exports: [RiderService],
})
export class RiderModule {}
