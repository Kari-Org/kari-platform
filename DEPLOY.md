# Deploying the Kari backend (Railway)

The backend is a single NestJS service that needs **Postgres** + **Redis**. It's
containerized from the repo root (`Dockerfile` + `railway.json`) because it's a
pnpm workspace (`backend` depends on `@kari/types`).

## One-time setup on Railway

1. **New Project → Deploy from GitHub repo** → pick this repo.
   Railway reads `railway.json` and builds the root `Dockerfile`. (No "root
   directory" override needed — the Dockerfile handles the workspace.)
2. **Add Postgres**: *New → Database → PostgreSQL*.
3. **Add Redis**: *New → Database → Redis*.
4. On the **backend service → Variables**, set the values below.
5. Deploy. Healthcheck hits `GET /health`; `PORT` is injected by Railway.

## Environment variables

**Required**
| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | strong random, ≥ 24 chars |
| `JWT_REFRESH_SECRET` | strong random, ≥ 24 chars (different) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (Railway reference) |

**First deploy only — bootstrap the schema**
| Var | Value |
|---|---|
| `DB_SYNCHRONIZE` | `true` |

> ⚠️ `DB_SYNCHRONIZE=true` lets TypeORM create the tables on the fresh DB so you
> can launch immediately. **Before you have real data, switch to migrations**:
> generate a baseline (`pnpm --filter @kari/backend migration:generate`), commit
> it, set `DB_SYNCHRONIZE=false`, and run `migration:run` on deploy. Leaving
> synchronize on in production risks destructive auto-alters.

**Recommended**
| Var | Value |
|---|---|
| `CORS_ORIGINS` | comma-separated admin + web origins (or `*` to start) |
| `LOG_LEVEL` | `info` |

**Optional providers** (absent ⇒ no-op; wire these as you go live)
- Payments: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- SMS / WhatsApp: `TERMII_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_VOICE_FROM`
- KYC (NIN/liveness): `DOJAH_API_KEY`, `DOJAH_APP_ID`
- Maps: `GOOGLE_MAPS_API_KEY`
- Google sign-in: `GOOGLE_OAUTH_CLIENT_IDS` (comma-separated client IDs)
- Push: `EXPO_ACCESS_TOKEN`
- Media (KYC selfies/docs): `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` (or Cloudflare R2 via the S3 API)

If you ever connect to the DB over Railway's **public** networking (vs. the
private `${{Postgres.DATABASE_URL}}`), also set `DB_SSL=true`.

## After it's live
- Note the public backend URL Railway assigns.
- Point the apps + admin at it:
  - `rider/app.json` and `driver/app.json` → `extra.apiBaseUrl` / `extra.socketUrl`
  - admin → `NEXT_PUBLIC_API_URL` (Vercel/host env)
- Then EAS **preview/production** builds will have a real API to talk to.

## Seed an admin (one-off)
```
cd backend && npx ts-node -r dotenv/config src/database/seed-admin.ts
# or set ADMIN_EMAIL / ADMIN_PASSWORD env first
```
(run against the production `DATABASE_URL`).
