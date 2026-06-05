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

  /** All drivers currently in the GEO set, with their last known position (admin fleet view). */
  async fleetPositions(): Promise<Array<{ driverId: string; lat: number; lng: number }>> {
    const ids = await this.redis.zrange(GEO_KEY, 0, -1);
    if (!ids.length) return [];
    const coords = (await this.redis.call('GEOPOS', GEO_KEY, ...ids)) as Array<
      [string, string] | null
    >;
    const out: Array<{ driverId: string; lat: number; lng: number }> = [];
    ids.forEach((id, i) => {
      const c = coords[i];
      if (c) out.push({ driverId: id, lng: Number(c[0]), lat: Number(c[1]) });
    });
    return out;
  }

  async findCandidates(
    lat: number,
    lng: number,
    category: CarCategory,
    preference: BehaviorPreference,
    preferredDriverId: string | null = null,
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
    // Subscriber's sticky driver: if they're eligible + nearby, dispatch exclusively to them.
    if (preferredDriverId && matched.includes(preferredDriverId)) {
      return [preferredDriverId];
    }
    return matched;
  }
}
