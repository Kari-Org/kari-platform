import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module';

export interface CommissionSplit {
  rateBps: number;
  commission: number; // kobo
  driverNet: number; // kobo
}

/**
 * Resolves the platform's cut of a fare. The base rate comes from config
 * (COMMISSION_RATE_BPS). The `resolveRateBps` hook is where Phase 11's
 * gamification reductions will subtract (e.g. top-3 drivers −100 bps, weekly
 * streaks more) — for now every driver pays the base rate.
 */
@Injectable()
export class CommissionService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async resolveRateBps(_driverId: string): Promise<number> {
    // TODO(Phase 11): subtract leaderboard/streak reductions for this driver.
    return this.config.money.commissionRateBps;
  }

  /** Splits a fare (kobo) into platform commission + driver net. Always exactly balanced. */
  computeSplit(fareKobo: number, rateBps: number): CommissionSplit {
    const commission = Math.round((fareKobo * rateBps) / 10_000);
    return { rateBps, commission, driverNet: fareKobo - commission };
  }
}
