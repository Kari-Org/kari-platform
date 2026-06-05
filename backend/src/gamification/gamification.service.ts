import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AchievementBadge } from '@kari/types';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { DriverService } from '../driver/driver.service';
import { Achievement } from './entities/achievement.entity';
import { DriverScore } from './entities/driver-score.entity';

const ALL_TIME = 'ALL';
const RIDE_MILESTONES: Array<{ badge: AchievementBadge; rides: number }> = [
  { badge: AchievementBadge.FIRST_RIDE, rides: 1 },
  { badge: AchievementBadge.TEN_RIDES, rides: 10 },
  { badge: AchievementBadge.FIFTY_RIDES, rides: 50 },
  { badge: AchievementBadge.HUNDRED_RIDES, rides: 100 },
];
const TOP_RATED_MIN_AVG = 4.8;
const TOP_RATED_MIN_COUNT = 20;

/**
 * Driver gamification: points, a weekly leaderboard, milestone achievements, and
 * the leaderboard-driven commission reduction that CommissionService consumes
 * (closing the Phase 3 hook). Points accrue per completed ride into the current
 * ISO-week bucket and an all-time bucket.
 */
@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(DriverScore) private readonly scores: Repository<DriverScore>,
    @InjectRepository(Achievement) private readonly achievements: Repository<Achievement>,
    private readonly drivers: DriverService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** ISO-8601 week key, e.g. `2026-W23`. */
  weekKey(d = new Date()): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((date.getTime() - firstThursday.getTime()) / 86_400_000 -
          3 +
          ((firstThursday.getUTCDay() + 6) % 7)) /
          7,
      );
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  private async bump(
    driverId: string,
    periodKey: string,
    points: number,
    rides: number,
  ): Promise<DriverScore> {
    const exists = await this.scores.findOne({ where: { driverId, periodKey } });
    if (!exists) {
      try {
        await this.scores.insert({ driverId, periodKey, points: 0, rides: 0 });
      } catch {
        // lost the unique(driver, period) race — the row exists now
      }
    }
    if (points) await this.scores.increment({ driverId, periodKey }, 'points', points);
    if (rides) await this.scores.increment({ driverId, periodKey }, 'rides', rides);
    return (await this.scores.findOne({ where: { driverId, periodKey } }))!;
  }

  /** Called when a ride completes: award points to the week + all-time, unlock badges. */
  async awardForRide(driverId: string): Promise<{ points: number; weekKey: string; newBadges: AchievementBadge[] }> {
    const points = this.config.engagement.pointsPerRide;
    const wk = this.weekKey();
    await this.bump(driverId, wk, points, 1);
    const allTime = await this.bump(driverId, ALL_TIME, points, 1);
    const newBadges = await this.evaluateBadges(driverId, allTime.rides);
    return { points, weekKey: wk, newBadges };
  }

  private async evaluateBadges(driverId: string, allTimeRides: number): Promise<AchievementBadge[]> {
    const want: AchievementBadge[] = [];
    for (const m of RIDE_MILESTONES) if (allTimeRides >= m.rides) want.push(m.badge);
    const driver = await this.drivers.findByUser(driverId);
    if (driver && driver.ratingAvg >= TOP_RATED_MIN_AVG && driver.ratingCount >= TOP_RATED_MIN_COUNT) {
      want.push(AchievementBadge.TOP_RATED);
    }
    const have = new Set((await this.achievements.find({ where: { driverId } })).map((a) => a.badge));
    const unlocked: AchievementBadge[] = [];
    for (const badge of want) {
      if (have.has(badge)) continue;
      try {
        await this.achievements.save(this.achievements.create({ driverId, badge }));
        unlocked.push(badge);
      } catch {
        // unique race — already unlocked
      }
    }
    return unlocked;
  }

  /** 1-based rank in the period, or null if the driver has no points yet. */
  async rankOf(driverId: string, periodKey = this.weekKey()): Promise<number | null> {
    const row = await this.scores.findOne({ where: { driverId, periodKey } });
    if (!row || row.points <= 0) return null;
    const ahead = await this.scores.count({ where: { periodKey, points: MoreThan(row.points) } });
    return ahead + 1;
  }

  /** Commission reduction (bps) earned via the current weekly leaderboard. */
  async commissionReductionBps(driverId: string): Promise<number> {
    const rank = await this.rankOf(driverId);
    if (rank === null) return 0;
    const reduction = rank <= 3 ? this.config.engagement.top3ReductionBps : 0;
    return Math.min(reduction, this.config.engagement.maxReductionBps);
  }

  async leaderboard(limit = 20) {
    const wk = this.weekKey();
    const rows = await this.scores.find({
      where: { periodKey: wk },
      order: { points: 'DESC', updatedAt: 'ASC' },
      take: limit,
    });
    const profiles = await this.drivers.findByUserIds(rows.map((r) => r.driverId));
    const nameById = new Map(
      profiles.map((p) => [p.userId, [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Driver']),
    );
    return {
      weekKey: wk,
      entries: rows.map((r, i) => ({
        rank: i + 1,
        driverId: r.driverId,
        name: nameById.get(r.driverId) ?? 'Driver',
        points: r.points,
        rides: r.rides,
      })),
    };
  }

  async getDriverSummary(driverId: string) {
    const wk = this.weekKey();
    const [week, all, rank, reductionBps, achievementsUnlocked] = await Promise.all([
      this.scores.findOne({ where: { driverId, periodKey: wk } }),
      this.scores.findOne({ where: { driverId, periodKey: ALL_TIME } }),
      this.rankOf(driverId, wk),
      this.commissionReductionBps(driverId),
      this.achievements.count({ where: { driverId } }),
    ]);
    return {
      weekKey: wk,
      weekPoints: week?.points ?? 0,
      weekRides: week?.rides ?? 0,
      weekRank: rank,
      allTimePoints: all?.points ?? 0,
      allTimeRides: all?.rides ?? 0,
      commissionReductionBps: reductionBps,
      achievementsUnlocked,
    };
  }

  async getAchievements(driverId: string) {
    const unlocked = await this.achievements.find({ where: { driverId } });
    const at = new Map(unlocked.map((a) => [a.badge, a.createdAt]));
    return Object.values(AchievementBadge).map((badge) => ({
      badge,
      unlocked: at.has(badge),
      unlockedAt: at.get(badge) ?? null,
    }));
  }
}
