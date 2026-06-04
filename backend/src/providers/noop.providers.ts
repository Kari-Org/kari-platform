import { Logger } from '@nestjs/common';
import type { GeoPoint } from '@kari/types';
import type {
  ChargeInput,
  ChargeResult,
  ChargeStatus,
  DeliveryResult,
  IdentityProvider,
  LivenessProvider,
  LivenessResult,
  LivenessSession,
  MapsProvider,
  NinVerificationResult,
  PaymentProvider,
  PlaceSuggestion,
  PushInput,
  PushProvider,
  PutObjectInput,
  SendMessageInput,
  SmsProvider,
  StorageProvider,
  TripEstimate,
  TripQuery,
  WhatsAppProvider,
} from './contracts';

const NAME = 'noop';

/** Great-circle distance in metres between two points. */
function haversineMetres(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export class NoopPaymentProvider implements PaymentProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopPaymentProvider');
  async initiateCharge(input: ChargeInput): Promise<ChargeResult> {
    this.logger.warn(`[noop] initiateCharge ref=${input.reference} amount=${input.amount}`);
    return { reference: input.reference, provider: this.name };
  }
  async verifyCharge(reference: string): Promise<ChargeStatus> {
    this.logger.warn(`[noop] verifyCharge ref=${reference}`);
    return 'pending';
  }
}

export class NoopIdentityProvider implements IdentityProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopIdentityProvider');
  async verifyNin(nin: string): Promise<NinVerificationResult> {
    // Dev stand-in: auto-approves so onboarding flows are testable. Production
    // must configure the real Dojah provider (see ProvidersModule).
    this.logger.warn(`[noop] verifyNin ****${nin.slice(-3)} -> AUTO-APPROVED (dev only)`);
    return { verified: true, provider: this.name, firstName: 'Dev', lastName: 'User' };
  }
}

export class NoopSmsProvider implements SmsProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopSmsProvider');
  async sendSms(input: SendMessageInput): Promise<DeliveryResult> {
    this.logger.warn(`[noop] sms -> ${input.to}: ${input.message}`);
    return { success: true, provider: this.name };
  }
}

export class NoopWhatsAppProvider implements WhatsAppProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopWhatsAppProvider');
  async sendWhatsApp(input: SendMessageInput): Promise<DeliveryResult> {
    this.logger.warn(`[noop] whatsapp -> ${input.to}: ${input.message}`);
    return { success: true, provider: this.name };
  }
}

export class NoopStorageProvider implements StorageProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopStorageProvider');
  async putObject(input: PutObjectInput): Promise<{ url: string }> {
    this.logger.warn(`[noop] putObject key=${input.key}`);
    return { url: `noop://local/${input.key}` };
  }
}

export class NoopMapsProvider implements MapsProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopMapsProvider');
  /** Deterministic haversine estimate so dev pricing works without Google. */
  async estimateTrip(query: TripQuery): Promise<TripEstimate> {
    const distanceMeters = Math.round(haversineMetres(query.origin, query.destination));
    const durationSeconds = Math.round(distanceMeters / 8.33); // ~30 km/h urban avg
    return { distanceMeters, durationSeconds, provider: NAME };
  }

  /**
   * Dev address autocomplete via OpenStreetMap Nominatim (keyless, Nigeria-only).
   * Production should bind a Google Places-backed MapsProvider instead.
   */
  async autocomplete(query: string, near?: GeoPoint): Promise<PlaceSuggestion[]> {
    const q = query.trim();
    if (q.length < 3) return [];
    try {
      const params = new URLSearchParams({ format: 'jsonv2', limit: '6', countrycodes: 'ng', q });
      if (near) {
        const d = 0.5; // ~50km bias box around the point
        params.set('viewbox', `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'Kari-Dev/0.1 (local development)' },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        place_id: number | string;
        display_name: string;
        lat: string;
        lon: string;
      }>;
      return data.map((row) => ({
        placeId: String(row.place_id),
        description: row.display_name,
        lat: Number(row.lat),
        lng: Number(row.lon),
      }));
    } catch (err) {
      this.logger.warn(`[noop] autocomplete failed: ${String(err)}`);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lng) });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { 'User-Agent': 'Kari-Dev/0.1 (local development)' },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { display_name?: string };
      return data.display_name ?? null;
    } catch (err) {
      this.logger.warn(`[noop] reverseGeocode failed: ${String(err)}`);
      return null;
    }
  }
}

export class NoopLivenessProvider implements LivenessProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopLivenessProvider');
  async createSession(): Promise<LivenessSession> {
    this.logger.warn('[noop] createSession');
    return { sessionId: 'noop-session' };
  }
  async getResult(sessionId: string): Promise<LivenessResult> {
    // Dev stand-in: auto-passes so onboarding flows are testable. Production
    // must configure real AWS Rekognition liveness (see ProvidersModule).
    this.logger.warn(`[noop] getResult ${sessionId} -> AUTO-PASSED (dev only)`);
    return { isLive: true, confidence: 0.99 };
  }
  async verifySelfie(imageBase64: string): Promise<LivenessResult> {
    this.logger.warn(
      `[noop] verifySelfie bytes=${imageBase64?.length ?? 0} -> AUTO-PASSED (dev only)`,
    );
    return { isLive: true, confidence: 0.99 };
  }
}

export class NoopPushProvider implements PushProvider {
  readonly name = NAME;
  private readonly logger = new Logger('NoopPushProvider');
  async send(input: PushInput): Promise<DeliveryResult> {
    this.logger.warn(`[noop] push -> ${input.to}: ${input.title}`);
    return { success: true, provider: this.name };
  }
}
