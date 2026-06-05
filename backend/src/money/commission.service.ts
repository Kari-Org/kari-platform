import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { GamificationService } from '../gamification/gamification.service';

export interface CommissionSplit {
  rateBps: number;
  commission: number; // kobo
  driverNet: number; // kobo
}

/**
 * Resolves the platform's cut of a fare: the base rate (COMMISSION_RATE_BPS)
 * minus the driver's leaderboard-earned reduction (Phase 4 gamification),
 * floored at COMMISSION_MIN_RATE_BPS so it can never go below the configured
 * minimum.
 */
@Injectable()
export class CommissionService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly gamification: GamificationService,
  ) {}

  async resolveRateBps(driverId: string): Promise<number> {
    const base = this.config.money.commissionRateBps;
    const reduction = await this.gamification.commissionReductionBps(driverId);
    return Math.max(this.config.engagement.minRateBps, base - reduction);
  }

  /** Splits a fare (kobo) into platform commission + driver net. Always exactly balanced. */
  computeSplit(fareKobo: number, rateBps: number): CommissionSplit {
    const commission = Math.round((fareKobo * rateBps) / 10_000);
    return { rateBps, commission, driverNet: fareKobo - commission };
  }
}
