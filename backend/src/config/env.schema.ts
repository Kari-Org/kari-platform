import { z } from 'zod';

/** Parse "true"/"false" env strings into booleans with a default. */
const boolEnv = (def: boolean) =>
  z
    .enum(['true', 'false'])
    .default(def ? 'true' : 'false')
    .transform((v) => v === 'true');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_NAME: z.string().default('kari'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: z.string().default('*'),

    // PostgreSQL
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
    POSTGRES_USER: z.string().default('kari'),
    POSTGRES_PASSWORD: z.string().default('kari'),
    POSTGRES_DB: z.string().default('kari'),
    DB_SYNCHRONIZE: boolEnv(false),
    DB_LOGGING: boolEnv(false),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT
    JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
    JWT_REFRESH_TTL: z.string().default('30d'),

    // Rate limiting
    THROTTLE_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

    // Ride pricing (naira)
    RIDE_BASE_FARE: z.coerce.number().nonnegative().default(500),
    RIDE_PER_KM: z.coerce.number().nonnegative().default(120),
    RIDE_PER_MIN: z.coerce.number().nonnegative().default(15),
    RIDE_FUEL_INDEX: z.coerce.number().positive().default(1),
    RIDE_NEGOTIATION_MIN_METERS: z.coerce.number().nonnegative().default(2000),

    // Money — commission, penalties, wallet limits (Phase 3)
    COMMISSION_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(2000), // 20%
    CANCELLATION_FEE: z.coerce.number().int().nonnegative().default(500), // naira, charged on late cancel
    CANCELLATION_GRACE_SECONDS: z.coerce.number().int().nonnegative().default(120), // free-cancel window after a driver accepts
    PENALTY_DRIVER_SHARE_BPS: z.coerce.number().int().min(0).max(10_000).default(6000), // 60% of a rider penalty compensates the driver
    DRIVER_CANCEL_FEE: z.coerce.number().int().nonnegative().default(0), // naira, charged to a driver who cancels post-accept
    MIN_TOPUP: z.coerce.number().int().positive().default(100), // naira
    MIN_PAYOUT: z.coerce.number().int().positive().default(1000), // naira

    // Engagement — gamification + referrals (Phase 4)
    GAMIFICATION_POINTS_PER_RIDE: z.coerce.number().int().nonnegative().default(10),
    GAMIFICATION_TOP3_REDUCTION_BPS: z.coerce.number().int().min(0).max(10_000).default(100), // −1% per top-3 leaderboard rank
    GAMIFICATION_MAX_REDUCTION_BPS: z.coerce.number().int().min(0).max(10_000).default(300), // cap total reduction
    COMMISSION_MIN_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(1000), // commission can't drop below 10%
    REFERRAL_REWARD: z.coerce.number().int().nonnegative().default(500), // naira credited to each side

    // Providers — all optional; absence selects the no-op implementation
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_PUBLIC_KEY: z.string().optional(),
    DOJAH_API_KEY: z.string().optional(),
    DOJAH_APP_ID: z.string().optional(),
    TERMII_API_KEY: z.string().optional(),
    TERMII_SENDER_ID: z.string().default('Kari'),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_WHATSAPP_FROM: z.string().optional(),
    TWILIO_VOICE_FROM: z.string().optional(),
    EMAIL_FROM: z.string().default('noreply@kari.ng'),
    EMAIL_API_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    // Comma-separated Google OAuth client IDs accepted as ID-token audiences
    // (iOS / web / Android). Absent ⇒ dev-only unverified decode (see GoogleAuthService).
    GOOGLE_OAUTH_CLIENT_IDS: z.string().optional(),
    EXPO_ACCESS_TOKEN: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      const weak = (s: string) => s.includes('change-me') || s.length < 24;
      if (weak(env.JWT_ACCESS_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'must be a strong secret (>= 24 chars) in production',
        });
      }
      if (weak(env.JWT_REFRESH_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'must be a strong secret (>= 24 chars) in production',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;
