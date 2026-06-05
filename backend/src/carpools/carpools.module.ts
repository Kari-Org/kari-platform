import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoneyModule } from '../money/money.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RiderModule } from '../rider/rider.module';
import { RidesModule } from '../rides/rides.module';
import { CarpoolsController } from './carpools.controller';
import { CarpoolsService } from './carpools.service';
import { CarpoolMember } from './entities/carpool-member.entity';
import { Carpool } from './entities/carpool.entity';

/**
 * Phase 5 — Carpooling. NIN-gated shared rides with fare cost-split, optimistic
 * seat claims, and single-transaction settlement across members. Reuses pricing
 * + matching (RidesModule), the ledger/commission (MoneyModule), and the NIN
 * status (RiderModule).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Carpool, CarpoolMember]),
    RidesModule,
    RiderModule,
    MoneyModule,
    RealtimeModule,
  ],
  controllers: [CarpoolsController],
  providers: [CarpoolsService],
})
export class CarpoolsModule {}
