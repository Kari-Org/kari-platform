# Deploying Kari (Railway — one platform)

Everything that is not the mobile apps runs on **Railway**, in one project:

| Service | Source | Notes |
|---|---|---|
| `@kari/backend` | root `Dockerfile` + `railway.json` | NestJS API + Socket.IO; needs Postgres + Redis |
| `@kari/admin` | `admin/Dockerfile` (context = repo root) | Next.js 15, standalone output |
| `@kari/web` | `web/Dockerfile` (context = repo root) | Next.js 15 marketing site, standalone output |
| Postgres 16 | Railway plugin | |
| Redis 7 | Railway plugin | |
| Bucket | Railway object storage | KYC media, via the S3-compatible API |

All three service images build from the **repo root** because this is a pnpm
workspace (each app depends on `@kari/types`). The mobile apps (`rider`,
`driver`) ship through **EAS**, not Railway.

## Node version

Pinned to **22.13.1** everywhere — `.nvmrc`, all three Dockerfiles, CI, and EAS —
so CI tests exactly what production runs. Change it in `.nvmrc` and the
Dockerfiles together.

## One-time setup on Railway

1. **New Project → Deploy from GitHub repo** → pick this repo. For the backend,
   Railway reads `railway.json` and builds the root `Dockerfile`.
2. **Add Postgres** and **Redis** (*New → Database*).
3. Add the **admin** and **web** services from the same repo: *New → GitHub repo*,
   then set each service's **Dockerfile path** (`admin/Dockerfile` / `web/Dockerfile`)
   with the **build context at the repo root** (root directory = `/`).
4. Set each service's **Variables** (below).
5. Deploy. The backend healthcheck hits `GET /health`; `PORT` is injected by Railway
   into all three (the Next apps' standalone `server.js` reads it automatically).

## Environment variables

**Required**
| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | strong random, ≥ 24 chars |
| `JWT_REFRESH_SECRET` | strong random, ≥ 24 chars (different) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (Railway reference) |

**Schema: migrations, not synchronize**
The backend runs TypeORM **migrations on boot** whenever `DB_SYNCHRONIZE` is off
(`migrationsRun` in `DatabaseModule`). Keep `DB_SYNCHRONIZE=false` in production
(it defaults to false — do **not** set it to `true`). Each deploy applies any new
migration from `backend/src/database/migrations/` automatically; the committed
baseline builds the whole schema (incl. the `uuid-ossp` extension) on a fresh DB.

- New schema change → `pnpm --filter @kari/backend migration:generate src/database/migrations/<Name>`, review, commit. It ships and runs on the next deploy.
- `DB_SYNCHRONIZE=true` is **local dev only** (see `docker-compose`), never production.

**Recommended**
| Var | Value |
|---|---|
| `CORS_ORIGINS` | comma-separated admin + web origins (the Railway URLs / custom domains) |
| `LOG_LEVEL` | `info` |

**Admin service variables**
| Var | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the backend's public Railway URL (proxied through admin's `/api/proxy`) |

(`web` is a static marketing site and needs no backend env.)

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
  - admin → `NEXT_PUBLIC_API_URL` (its Railway service variables)
- Add the admin + web origins to the backend's `CORS_ORIGINS`.
- Then EAS **preview/production** builds will have a real API to talk to.

## Seed an admin (one-off)
```
cd backend && npx ts-node -r dotenv/config src/database/seed-admin.ts
# or set ADMIN_EMAIL / ADMIN_PASSWORD env first
```
(run against the production `DATABASE_URL`).
