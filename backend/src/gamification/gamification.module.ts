import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverModule } from '../driver/driver.module';
import { Achievement } from './entities/achievement.entity';
import { DriverScore } from './entities/driver-score.entity';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

/**
 * Phase 4 — Gamification. Driver points, weekly leaderboard, and milestone
 * achievements. Exports GamificationService so MoneyModule's CommissionService
 * can read the leaderboard-driven commission reduction, and RidesService can
 * award points on ride completion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DriverScore, Achievement]), DriverModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
