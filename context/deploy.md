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

## Branching model & environments (staging → production)

Two long-lived branches map to two isolated Railway environments (optionally a
third, ephemeral tier for PR previews). This replaces the earlier "every push to
`main` deploys production" flow.

| Git branch   | Railway environment | Deploys                    | Advances when…                                         |
| ------------ | ------------------- | -------------------------- | ------------------------------------------------------ |
| `main`       | **staging**         | staging stack, every merge | a reviewed PR merges (trunk)                           |
| `production` | **production**      | production stack           | a reviewed **promotion PR** `main → production` merges |
| `feature/*`  | PR preview (opt-in) | ephemeral fork of staging  | a PR is opened/updated; torn down on close             |

**Trunk-based:** cut `feature/*` off `main`, PR back into `main`; every merge
auto-deploys **staging**. Production advances only through an explicit, reviewed
promotion PR `main → production`, so `main` pushes never touch prod. Both tiers
use the identical branch-tracking + `watchPatterns` + "Wait for CI" mechanism;
auto-deploy stays **on** in both — the gate is that `production` is human-gated by
branch protection, not a manual deploy button.

- **Promote** with a **merge commit** (not squash — squash makes `production`
  diverge and muddies the next promotion diff); `production` history stays a
  superset of `main`.
- **Hotfix:** normal PR → `main` → verify on staging → fast promotion PR. If prod
  is broken and `main` holds unreleased work, branch off `production`, PR straight
  into `production`, then back-merge to `main`.
- **Rollback:** redeploy the last-good production deployment in Railway (instant,
  reuses the prior image). Migrations are forward-only — a schema rollback needs a
  compensating migration, not an auto-revert.

### Environments vs. per-service config

An environment is a **fully isolated stack** — its own copy of all three services
**and its own Postgres, Redis, and bucket**, with its own variables.

| Layer                 | Scope                           | Behaviour                                                                                                      |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Tracked branch        | per service, per environment    | production-env services track `production`; staging-env services track `main`.                                 |
| `railway.json`        | read from the repo, per service | same file on both branches → identical build/deploy/watch in every env; no per-env file.                       |
| `build.watchPatterns` | per push, per service, per env  | a push rebuilds only the services whose patterns match the changed files — same isolation in staging and prod. |
| Variables / refs      | **per environment**             | `${{Postgres.DATABASE_URL}}` resolves to _that env's_ DB, so staging code hits the staging DB unchanged.       |

> Both warnings from _Per-service config + build isolation_ apply **per
> environment**: set each staging service's Config-as-Code path, and never add a
> dashboard "Watch Paths" override (it shadows the file's `watchPatterns`).

### Migration safety — staging migrates first

The backend runs migrations on boot (see _Schema_) and each environment has its
**own** DB, so a schema change is proven in three layers: **CI** (fresh DB, every
push) → **staging** (persistent staging DB, real-shaped data — catches what an
empty CI DB can't) → **production** (same migration, after staging proved it). The
health-check is the safety net: Railway won't cut traffic until `/health` passes,
so a migration that crashes on boot is a failed deploy, not an outage — the
previous deploy keeps serving.

> **Hard requirement:** the staging environment must have its **own**
> Postgres/Redis/bucket — never a reference to prod's. If staging's
> `${{Postgres.DATABASE_URL}}` resolves to the prod DB, a staging deploy migrates
> **production**. Verify this before the first staging deploy.

Keep migrations backward-compatible (expand/contract) so a boot migration doesn't
break the still-serving old container during rollout. Safe at one backend replica;
if you scale replicas, move migrations to a dedicated release step.

### CI gating

`.github/workflows/ci.yml` triggers on push to **`main`** and **`production`** and
on every PR. PRs run only the affected workspaces (fast feedback); a push to either
deploy branch runs the full suite **plus** the migration gate. Railway's
per-service "Wait for CI" holds each environment's deploy until that commit's
`verify` job is green — including the post-merge run on `production` that gates a
promotion.

### Cutover & staging setup (one-time)

The production env and services already exist (from _One-time setup_); this adds
the split.

1. **`production` branch** — created from the live `main` SHA. Fast-forward it to
   current `main` immediately before step 2 so the repoint is a true no-op.
2. **Repoint the production env** (backend/admin/web): Settings → Source → tracked
   branch `main` → **`production`**. Keep "Wait for CI" on; config path unchanged.
   **This is the step that stops `main` pushes from deploying prod.**
3. **Create the `staging` env** → New Environment → fork from production →
   **duplicate Postgres, Redis, and the bucket** (fresh, isolated). Each service:
   tracked branch `main`, "Wait for CI" on, config path inherited.
4. **Staging variables:** staging `JWT_*` secrets, `CORS_ORIGINS` = staging
   admin/web origins, `NEXT_PUBLIC_API_URL` = staging backend URL, provider **test**
   keys, `HOSTNAME=0.0.0.0`; leave `DB_SYNCHRONIZE` unset. Confirm the DB/Redis refs
   resolve to the **staging** plugins.
5. **Seed a staging admin** against the staging DB proxy (separate DB → its own
   admin row).
6. **Branch protection** (GitHub → Settings → Branches) on `main` **and**
   `production`: require a PR, require the `verify` check, ≥ 1 approval, block
   force-push/delete. Leave `production` without a linear-history requirement so
   merge-commit promotions are allowed.

### PR preview environments (optional)

Railway → project Settings → enable PR Environments, **base = `staging`** (never
production — previews inherit the base env's variables, so basing on staging keeps
**test** provider keys out of prod-secret range). Each PR forks staging into an
ephemeral env (own DBs, migrations from baseline), torn down on close;
`watchPatterns` still scope which services build. Cost is one full stack per open
PR — gate behind a label if volume grows.

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
