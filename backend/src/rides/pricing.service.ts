import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';
import { CarCategory } from '@kari/types';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { MAPS_PROVIDER, type MapsProvider } from '../providers/contracts';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { QuoteDto } from './dto/quote.dto';

const TIER_MULTIPLIER: Record<CarCategory, number> = {
  [CarCategory.ECONOMY]: 1,
  [CarCategory.COMFORT]: 1.3,
  [CarCategory.PREMIUM]: 1.6,
};
const QUOTE_TTL_SECONDS = 900;

export interface Fare {
  category: CarCategory;
  amount: number;
}

export interface Quote {
  ref: string;
  distanceMeters: number;
  durationSeconds: number;
  fares: Fare[];
  negotiable: boolean;
  expiresInSeconds: number;
  pickup: { lat: number; lng: number; address: string | null };
  dropoff: { lat: number; lng: number; address: string | null };
}

/**
 * Computes tiered fares from a maps trip estimate (distance + duration), scaled
 * by a traffic multiplier and the configured fuel index, then caches the quote
 * in Redis with a reference the booking step validates against.
 */
@Injectable()
export class PricingService {
  constructor(
    @Inject(MAPS_PROVIDER) private readonly maps: MapsProvider,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  private fareFor(
    category: CarCategory,
    distanceMeters: number,
    durationSeconds: number,
    durationInTrafficSeconds?: number,
  ): number {
    const km = distanceMeters / 1000;
    const minutes = durationSeconds / 60;
    const p = this.cfg.pricing;
    const trafficMultiplier =
      durationInTrafficSeconds && durationSeconds > 0
        ? Math.min(1.5, Math.max(1, durationInTrafficSeconds / durationSeconds))
        : 1;
    const base = (p.baseFare + p.perKm * km + p.perMin * minutes) * p.fuelIndex * trafficMultiplier;
    const amount = base * TIER_MULTIPLIER[category];
    return Math.max(p.baseFare, Math.round(amount / 10) * 10); // round to nearest ₦10
  }

  async quote(dto: QuoteDto): Promise<Quote> {
    const pickup = { lat: dto.pickupLat, lng: dto.pickupLng };
    const dropoff = { lat: dto.dropoffLat, lng: dto.dropoffLng };
    const est = await this.maps.estimateTrip({ origin: pickup, destination: dropoff });

    const fares: Fare[] = Object.values(CarCategory).map((category) => ({
      category,
      amount: this.fareFor(
        category,
        est.distanceMeters,
        est.durationSeconds,
        est.durationInTrafficSeconds,
      ),
    }));

    const quote: Quote = {
      ref: randomBytes(6).toString('hex'),
      distanceMeters: est.distanceMeters,
      durationSeconds: est.durationSeconds,
      fares,
      negotiable: est.distanceMeters >= this.cfg.pricing.negotiationMinMeters,
      expiresInSeconds: QUOTE_TTL_SECONDS,
      pickup: { ...pickup, address: dto.pickupAddress ?? null },
      dropoff: { ...dropoff, address: dto.dropoffAddress ?? null },
    };
    await this.redis.set(`quote:${quote.ref}`, JSON.stringify(quote), 'EX', QUOTE_TTL_SECONDS);
    return quote;
  }

  async getQuote(ref: string): Promise<Quote> {
    const raw = await this.redis.get(`quote:${ref}`);
    if (!raw) {
      throw new NotFoundException('quote expired or not found — request a new quote');
    }
    return JSON.parse(raw) as Quote;
  }
}
