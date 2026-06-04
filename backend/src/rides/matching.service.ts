import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { BehaviorPreference, type CarCategory, DriverAvailability } from '@kari/types';
import { DriverService } from '../driver/driver.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

const GEO_KEY = 'drivers:geo';
const DEFAULT_RADIUS_METERS = 5000;
const DEFAULT_LIMIT = 10;

/**
 * Live driver matching backed by a Redis GEO set. Candidates are filtered by
 * availability, car category, and the rider's personality preference. Members
 * of the GEO set are driver userIds.
 */
@Injectable()
export class MatchingService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly drivers: DriverService,
  ) {}

  async setOnline(userId: string, lat: number, lng: number): Promise<void> {
    await this.redis.call('GEOADD', GEO_KEY, String(lng), String(lat), userId);
    await this.drivers.setAvailability(userId, DriverAvailability.ONLINE);
  }

  async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    await this.redis.call('GEOADD', GEO_KEY, String(lng), String(lat), userId);
  }

  async setOffline(userId: string): Promise<void> {
    await this.redis.zrem(GEO_KEY, userId);
    await this.drivers.setAvailability(userId, DriverAvailability.OFFLINE);
  }

  async findCandidates(
    lat: number,
    lng: number,
    category: CarCategory,
    preference: BehaviorPreference,
    radiusMeters = DEFAULT_RADIUS_METERS,
    limit = DEFAULT_LIMIT,
  ): Promise<string[]> {
    const nearby = (await this.redis.call(
      'GEOSEARCH',
      GEO_KEY,
      'FROMLONLAT',
      String(lng),
      String(lat),
      'BYRADIUS',
      String(radiusMeters),
      'm',
      'ASC',
      'COUNT',
      String(limit * 3),
    )) as string[];

    if (!nearby || nearby.length === 0) {
      return [];
    }

    const profiles = await this.drivers.findByUserIds(nearby);
    const byId = new Map(profiles.map((p) => [p.userId, p]));
    const matched: string[] = [];

    for (const id of nearby) {
      const p = byId.get(id);
      if (!p || !p.onboardingComplete || p.availability !== DriverAvailability.ONLINE) {
        continue;
      }
      if (!p.vehicle || p.vehicle.category !== category) {
        continue;
      }
      const personalityMatches =
        preference === BehaviorPreference.NO_PREFERENCE ||
        (p.personality as string | null) === (preference as string);
      if (!personalityMatches) {
        continue;
      }
      matched.push(id);
      if (matched.length >= limit) {
        break;
      }
    }
    return matched;
  }
}
