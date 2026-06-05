import { config as loadDotenv } from 'dotenv';
import { envSchema } from './env.schema';

export interface AppConfig {
  env: 'development' | 'staging' | 'production' | 'test';
  isProd: boolean;
  isTest: boolean;
  name: string;
  port: number;
  logLevel: string;
  corsOrigins: string | string[];
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
  };
  redis: { url: string };
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  throttle: { ttl: number; limit: number };
  pricing: {
    baseFare: number;
    perKm: number;
    perMin: number;
    fuelIndex: number;
    negotiationMinMeters: number;
  };
  money: {
    commissionRateBps: number;
    cancellationFee: number; // naira
    cancellationGraceSeconds: number;
    penaltyDriverShareBps: number;
    driverCancelFee: number; // naira
    minTopup: number; // naira
    minPayout: number; // naira
  };
  engagement: {
    pointsPerRide: number;
    top3ReductionBps: number;
    maxReductionBps: number;
    minRateBps: number;
    referralReward: number; // naira
  };
  providers: {
    paystack: { secretKey?: string; publicKey?: string };
    dojah: { apiKey?: string; appId?: string };
    termii: { apiKey?: string; senderId: string };
    twilio: { accountSid?: string; authToken?: string; whatsappFrom?: string; voiceFrom?: string };
    email: { from: string; apiKey?: string };
    aws: { region: string; accessKeyId?: string; secretAccessKey?: string; s3Bucket?: string };
    google: { mapsApiKey?: string; oauthClientIds: string[] };
    expo: { accessToken?: string };
  };
}

/**
 * Loads .env (if present), validates the environment with Zod, and returns a
 * typed, nested config object. Throws a readable error on invalid config so the
 * process fails fast at boot rather than at first use.
 */
export function loadConfiguration(): AppConfig {
  loadDotenv();

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const e = parsed.data;
  return {
    env: e.NODE_ENV,
    isProd: e.NODE_ENV === 'production',
    isTest: e.NODE_ENV === 'test',
    name: e.APP_NAME,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    corsOrigins:
      e.CORS_ORIGINS.trim() === '*'
        ? '*'
        : e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    database: {
      host: e.POSTGRES_HOST,
      port: e.POSTGRES_PORT,
      user: e.POSTGRES_USER,
      password: e.POSTGRES_PASSWORD,
      name: e.POSTGRES_DB,
      synchronize: e.DB_SYNCHRONIZE,
      logging: e.DB_LOGGING,
    },
    redis: { url: e.REDIS_URL },
    jwt: {
      accessSecret: e.JWT_ACCESS_SECRET,
      accessTtl: e.JWT_ACCESS_TTL,
      refreshSecret: e.JWT_REFRESH_SECRET,
      refreshTtl: e.JWT_REFRESH_TTL,
    },
    throttle: { ttl: e.THROTTLE_TTL, limit: e.THROTTLE_LIMIT },
    pricing: {
      baseFare: e.RIDE_BASE_FARE,
      perKm: e.RIDE_PER_KM,
      perMin: e.RIDE_PER_MIN,
      fuelIndex: e.RIDE_FUEL_INDEX,
      negotiationMinMeters: e.RIDE_NEGOTIATION_MIN_METERS,
    },
    money: {
      commissionRateBps: e.COMMISSION_RATE_BPS,
      cancellationFee: e.CANCELLATION_FEE,
      cancellationGraceSeconds: e.CANCELLATION_GRACE_SECONDS,
      penaltyDriverShareBps: e.PENALTY_DRIVER_SHARE_BPS,
      driverCancelFee: e.DRIVER_CANCEL_FEE,
      minTopup: e.MIN_TOPUP,
      minPayout: e.MIN_PAYOUT,
    },
    engagement: {
      pointsPerRide: e.GAMIFICATION_POINTS_PER_RIDE,
      top3ReductionBps: e.GAMIFICATION_TOP3_REDUCTION_BPS,
      maxReductionBps: e.GAMIFICATION_MAX_REDUCTION_BPS,
      minRateBps: e.COMMISSION_MIN_RATE_BPS,
      referralReward: e.REFERRAL_REWARD,
    },
    providers: {
      paystack: { secretKey: e.PAYSTACK_SECRET_KEY, publicKey: e.PAYSTACK_PUBLIC_KEY },
      dojah: { apiKey: e.DOJAH_API_KEY, appId: e.DOJAH_APP_ID },
      termii: { apiKey: e.TERMII_API_KEY, senderId: e.TERMII_SENDER_ID },
      twilio: {
        accountSid: e.TWILIO_ACCOUNT_SID,
        authToken: e.TWILIO_AUTH_TOKEN,
        whatsappFrom: e.TWILIO_WHATSAPP_FROM,
        voiceFrom: e.TWILIO_VOICE_FROM,
      },
      email: { from: e.EMAIL_FROM, apiKey: e.EMAIL_API_KEY },
      aws: {
        region: e.AWS_REGION,
        accessKeyId: e.AWS_ACCESS_KEY_ID,
        secretAccessKey: e.AWS_SECRET_ACCESS_KEY,
        s3Bucket: e.S3_BUCKET,
      },
      google: {
        mapsApiKey: e.GOOGLE_MAPS_API_KEY,
        oauthClientIds: e.GOOGLE_OAUTH_CLIENT_IDS
          ? e.GOOGLE_OAUTH_CLIENT_IDS.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      },
      expo: { accessToken: e.EXPO_ACCESS_TOKEN },
    },
  };
}
