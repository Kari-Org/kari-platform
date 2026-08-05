# Deploying Kari (Railway — one platform)

Everything that is not the mobile apps runs on **Railway**, in one project. Each
service is configured **in code** via its own `railway.json` (build + deploy +
watch patterns); the only per-service dashboard setting is which config file it
reads (see _Per-service config_). The mobile apps (`rider`, `driver`) ship through
**EAS** as native binaries — they are not on Railway.

| Service         | Config file            | Dockerfile          | Live URL                                |
| --------------- | ---------------------- | ------------------- | --------------------------------------- |
| `@kari/backend` | `backend/railway.json` | `Dockerfile` (root) | `karibackend-production.up.railway.app` |
| `admin`         | `admin/railway.json`   | `admin/Dockerfile`  | `admin-production-02d3.up.railway.app`  |
| `web`           | `web/railway.json`     | `web/Dockerfile`    | `web-production-9558c.up.railway.app`   |
| Postgres 16     | Railway plugin         | —                   | private + public proxy                  |
| Redis 7         | Railway plugin         | —                   | private                                 |
| Bucket          | Railway object storage | —                   | KYC media, via the S3-compatible API    |

All three images build from the **repo root** (root directory = `/`) because this
is a pnpm workspace and every app depends on `@kari/types`. Each `railway.json`'s
`build.dockerfilePath` selects that service's Dockerfile. (Vercel is retired — admin
and web used to live there; they are fully on Railway now.)

## Images

- **Node pinned to 22.13.1** everywhere — `.nvmrc`, all Dockerfiles, CI, EAS — so CI
  tests what prod runs. Change it in `.nvmrc` and the Dockerfiles together.
- **Base is `node:22.13.1-alpine`.** The Next apps add `apk add --no-cache libc6-compat`
  (glibc shim for Next's native SWC/sharp on musl).
- **pnpm is installed via `npm i -g pnpm@11.5.1`, not corepack** — corepack bundled
  with pinned Node patches ships stale signing keys and fails `corepack prepare`.
- **Backend** ships a lean production bundle via `pnpm --filter @kari/backend deploy
--prod --legacy /prod` (backend `dist` + prod deps only, `@kari/types` resolved).
  Without it the image would copy the whole workspace `node_modules` (~1.7GB).
  `--legacy` is required by this repo's hoisted linker.
- **Admin / web** use Next.js standalone output (`output: 'standalone'` +
  `outputFileTracingRoot` at the repo root); the runtime copies only `.next/standalone`.
- Approx sizes: backend ~415MB, admin ~330MB, web ~337MB.

## Per-service config + build isolation

Each service reads **its own** `railway.json` (there is no shared root one). Set the
service's **Config-as-Code file path** in the dashboard once:

| Service         | Config file path       |
| --------------- | ---------------------- |
| `@kari/backend` | `backend/railway.json` |
| `admin`         | `admin/railway.json`   |
| `web`           | `web/railway.json`     |

> Railway exposes no CLI/variable for the config-file path or watch patterns, so this
> one pointer per service is a manual dashboard step. Do **not** also set a dashboard
> "Watch Paths" override — it silently shadows the file's `watchPatterns`.

Each file's `build.watchPatterns` scopes deploys so a change only rebuilds the
services it affects: `backend/**` → backend only, `admin/**` → admin only, `web/**` →
web only, `packages/**` (shared `@kari/types`) → all three, and the shared root build
inputs (`/pnpm-lock.yaml`, `/pnpm-workspace.yaml`, `/tsconfig.base.json`,
`/.dockerignore`, plus `/Dockerfile` for the backend). Patterns for root-level files
are **anchored with a leading slash** — Railway matches gitignore-style, so a bare
`Dockerfile` would also match `admin/Dockerfile`/`web/Dockerfile`. `driver`/`rider`
are EAS, so they never trigger a Railway build.

## One-time setup on Railway

1. **New Project → Deploy from GitHub repo** → pick this repo (creates the backend service).
2. **Add Postgres** and **Redis** (_New → Database_).
3. Add the **admin** and **web** services (_New → GitHub repo_, same repo).
4. For **each** service → Settings: root directory = `/`, and **Config-as-Code file path**
   = its file from the table above.
5. Set each service's **Variables** (below).
6. Deploy. Healthcheck hits `GET /health` on all three (admin/web serve a `/health`
   route; `PORT` is injected by Railway).

## Environment variables

**Backend — required**
| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | strong random, ≥ 24 chars |
| `JWT_REFRESH_SECRET` | strong random, ≥ 24 chars (different) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (Railway reference) |
| `CORS_ORIGINS` | the admin + web origins, comma-separated (the `*.up.railway.app` URLs) |
| `DB_SSL` | `true` if using the DB's public proxy instead of `${{Postgres.DATABASE_URL}}` |
| `LOG_LEVEL` | `info` (recommended) |

**Admin service**
| Var | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the backend's public Railway URL (proxied through admin's `/api/proxy`) |
| `HOSTNAME` | `0.0.0.0` — Next standalone otherwise binds to Docker's container-ID hostname and Railway can't reach it ("service unavailable") |

**Web service**
| Var | Value |
|---|---|
| `HOSTNAME` | `0.0.0.0` (same reason as admin) |

(Web is a static marketing site and needs no backend env beyond `HOSTNAME`.)

**Optional providers** (absent ⇒ no-op; wire these as you go live)

- Payments: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- SMS / WhatsApp: `TERMII_API_KEY`, `TERMII_SENDER_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_VOICE_FROM`
- KYC (NIN/liveness): `DOJAH_API_KEY`, `DOJAH_APP_ID`
- Maps: `GOOGLE_MAPS_API_KEY`
- Google sign-in: `GOOGLE_OAUTH_CLIENT_IDS` (comma-separated client IDs)
- Push: `EXPO_ACCESS_TOKEN`
- Media (KYC selfies/docs): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME` (Railway bucket via its S3-compatible API)

## Schema: migrations, not synchronize

The backend runs TypeORM **migrations on boot** whenever `DB_SYNCHRONIZE` is off
(`migrationsRun` in `DatabaseModule`). Keep `DB_SYNCHRONIZE` **unset** in production —
it defaults to `false`; do **not** set it to `true`. Each deploy applies any new
migration from `backend/src/database/migrations/`; the committed baseline builds the
whole schema (incl. the `uuid-ossp` extension) on a fresh DB.

- New schema change → `pnpm --filter @kari/backend migration:generate src/database/migrations/<Name>`, review, commit. It ships and runs on the next deploy.
- `DB_SYNCHRONIZE=true` is **local dev only** (see `docker-compose`), never production.

## Mobile apps (EAS, not Railway)

`rider` and `driver` build through EAS. Point them at the backend and rebuild:

- `rider/app.json` / `driver/app.json` → `extra.apiBaseUrl` / `extra.socketUrl` = the backend's public Railway URL.
- Then EAS **preview/production** builds talk to the live API.

## Seed an admin (one-off)

```bash
cd backend && npx ts-node -r dotenv/config src/database/seed-admin.ts
# or set ADMIN_EMAIL / ADMIN_PASSWORD first
```

Run against the production DB (its public proxy URL). Admins sign in at the admin
service with email + password (they skip the SMS OTP that riders/drivers use).
