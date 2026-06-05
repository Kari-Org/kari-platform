import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoneyModule } from '../money/money.module';
import { User } from '../users/entities/user.entity';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

/**
 * Phase 4 — Referrals. Shareable codes, one-time apply, and a both-sides reward
 * on the referee's first completed ride (funded from REVENUE via the ledger).
 * Exports ReferralsService so RidesService can trigger the reward on completion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), MoneyModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
