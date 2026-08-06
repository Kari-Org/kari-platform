# Progress Log

> **What this file governs:** the living record of what has actually been built and decided — newest
> first. For _why_ see [foundation.md](foundation.md) (it wins on conflict); for what's buildable next
> see [build-graph.md](build-graph.md). This file replaced `progress-tracker.md` (2026-07-30); its
> verification history is preserved below.

## Standing instruction for the AI agent

**After completing any work in this project, before ending your response, prepend a progress entry
here.** This is mandatory — the same way reading the context files first is mandatory. Entry format:

```
### <category> · <area> · <short title> — YYYY-MM-DD
**What:** one line (itemize if one session produced several parts)
**Notes:** gotchas, limitations, follow-ups (omit if none)
```

Categories: `feature` / `fix` / `refactor` / `chore` / `decision` / `docs`.
Areas: `backend`, `rider`, `driver`, `admin`, `web`, `packages/*`, `db`, `infra`, `context`.

**The drift rule:** if an entry is a `decision` that changes anything in `foundation.md` or another
context file, update that file too (foundation first) and add a `docs` entry noting it. Context files
must never drift from what was decided.

---

## Entries

### fix · infra · CI: stop cancel-in-progress from dropping main/production verify — 2026-08-06

**What:** `ci.yml` concurrency was `cancel-in-progress: true` on `ci-${{ github.ref }}`, so when two
PRs merged to `main` seconds apart the intermediate commit's `verify` got cancelled and never
completed — twice this session (`35b1223`, `df53c0c`). Since Railway Wait-for-CI keys on each commit's
own `verify`, a cancelled intermediate can leave that commit's deploy stuck. Now
`cancel-in-progress: ${{ github.event_name == 'pull_request' }}` — PR runs still cancel, push runs on
`main`/`production` always run to completion.
**Notes:** `mobile-ci.yml` left as-is (it gates no deploy). If a lockfile-changing merge's `verify` was
already dropped, staging may need a manual redeploy of the tip once it's green — Lane B (Railway) call.

### fix · infra · Dependabot security: 15/16 flagged deps patched via pnpm overrides (#10) — 2026-08-06

**What:** 50 alerts → 16 unique packages (mostly transitive DoS). Added `overrides:` in
`pnpm-workspace.yaml` (pnpm 11 ignores package.json's `pnpm` field) forcing patched versions: tar
(critical), undici, fast-uri, socket.io-parser, postcss, next, sharp, shell-quote, multer, form-data,
typeorm, body-parser, plus per-major `ws@8`, `js-yaml@{3,4}`, `brace-expansion@{1,2,5}`. Verified
locally (typecheck 8/8, tests, build 4/4) + CI verify incl. migration gate green. Lockfile consolidated
48 duplicate versions.
**Notes:** `uuid` deferred — advisory wants ≥11.1.1 but old transitive majors (3/7/9) can't be forced
to 11.x without breaking their callers; needs the parent deps to update. `multer` 1→2 is safe here
(backend is NestJS 11, already on multer 2.x). Closed the redundant Dependabot postcss PR (#8).

### chore · infra · Mobile prettier gate + gate-ok made a required check on main (#9) — 2026-08-06

**What:** Formatted 54 drifted rider/driver source files and added a mobile-scoped `prettier --check`
(`.github/prettier/mobile.prettierignore` + a `format` step in the mobile-gate action) so `gate-ok`
enforces it — without re-coupling rider/driver to root `format:check` (they stay in root
`.prettierignore`). Also removed the workflow-level `on.pull_request.paths` filter from `mobile-ci.yml`
so Mobile CI runs on every PR and `gate-ok` always reports, then required `verify` + `gate-ok` on `main`.
**Notes:** Kept root `format:check` excluding rider/driver on purpose — a mobile-format drift now only
reds `gate-ok`, never `verify` (so it can't block Railway deploys).

### chore · infra · CodeQL + Dependabot security updates + .claude prettier-ignore (#7) — 2026-08-06

**What:** Added `.github/workflows/codeql.yml` (JS/TS, build-mode none; PRs + push main/production +
weekly), independent of `verify` so it never gates Railway deploys. Enabled Dependabot **security
updates** on the repo (alerts were already on). Added `.claude/` to `.prettierignore` to stop stray
rewrites of the tracked settings file.

### chore · infra · Verified staging Tigris S3 creds (still Phase-0 no-op in app) — 2026-08-06

**What:** Read-only probe (HeadBucket + ListObjectsV2 via `railway run`) confirmed the staging object
store creds are valid: **Tigris** (`t3.storageapi.dev`, region `sjc`), isolated bucket, auth + read OK,
0 objects.
**Notes:** The backend still binds `STORAGE_PROVIDER` to `NoopStorageProvider` (Phase-0), so nothing in
the app uses these creds yet — they're staged for the real S3 provider. Email is also a no-op provider,
so staging has no working password-reset email (rotate the admin password via a direct DB update).

### chore · infra · Alpine base for all 3 images + mobile size check — 2026-08-05

**What:** Switched all three service images from `node:22.13.1-slim` to `-alpine`. New sizes (all boot
verified): **backend 415MB** (was 535MB / originally 1.7GB), **admin 330MB** (was 450MB), **web 337MB**
(was 456MB). The Next apps (admin/web) get `apk add --no-cache libc6-compat` as a glibc shim for
Next's native SWC/sharp on musl. Verified: backend boots + runs the baseline migration + serves
`/health`; admin serves `/login` 200 + `/` 307 (auth) ; web serves `/` 200 — no musl/native errors.
**Mobile check (rider/driver):** they are **EAS-built native binaries, not Docker images** — no
container to slim. Checked what matters anyway: each has 34 prod deps (only `react-native-maps` beyond
standard Expo/RN + the shared `@kari/mobile-core`/`@kari/types`), assets are small (rider 2.5MB,
driver 204KB), and graphify + grep confirmed **no cross-app imports** (they pull only `@kari/mobile-core`

- own code). So the mobile apps are already lean; their binary size is inherent RN/Expo runtime, not
  bloat. **Gotchas:** admin's first alpine build hit a transient `apk` mirror failure ("unable to select
  packages") — a rebuild fixed it (web built fine with the identical line). Earlier a boot-test falsely
  failed on "Invalid environment configuration" — that was a too-short JWT test secret (schema enforces
  length), not alpine.

### chore · infra · Slim backend image 1.7GB → 535MB — 2026-08-05

**What:** The runtime image did `COPY --from=build /app ./` — the whole workspace, so it shipped the
entire monorepo's `node_modules` (1GB): Next.js, React Native, Expo, dev tooling, none of which the
backend runs. Replaced it with a `pnpm --filter @kari/backend deploy --prod --legacy /prod` step that
emits a self-contained bundle (backend `dist` + prod deps only, `@kari/types` resolved; 165MB), and the
runtime stage now copies only that. Result: 1.7GB → **535MB** (68% smaller), verified booting + running
the baseline migration on a fresh DB + serving `/health`.
**Notes:** `--legacy` is required by the repo's hoisted linker (plain `pnpm deploy` errors). `typescript`
(23M) still rides in as a transitive prod dep — minor, left alone. Further slimming to ~380MB is
possible with an `alpine` base, deferred (musl/native-module risk not worth it; backend has no native
deps today but that could change). Root `Dockerfile`-only change, so per the watch-isolation only the
backend rebuilds.

### chore · infra · Railway service isolation + watch-path resolution — 2026-08-05

**What:** Vercel decommissioned (admin/web fully on Railway; backend CORS points at the Railway
domains). Worked the deploy-trigger / watch-path behavior: root-level changes (`Dockerfile`,
`railway.json`, `packages/**`, lockfile) were being SKIPPED for the backend because it had a dashboard
"Watch Paths" override of `backend/**`. Cleared that override (dashboard) — confirmed a root-only push
now redeploys the backend.
**Final solution (DONE + verified):** per-service config files — `backend/railway.json`,
`admin/railway.json`, `web/railway.json` — each with its own `build.watchPatterns`, `dockerfilePath`,
and healthcheck. Each Railway service's dashboard "Config file path" points at its file (the one
unavoidable dashboard step; Railway exposes no CLI/variable for it). Pruned: the shared root
`railway.json` (now dead) and the `RAILWAY_DOCKERFILE_PATH` vars on admin/web (each per-service file
carries `dockerfilePath`). **Verified isolation both ways:** a web-only push rebuilt only web
(backend+admin SKIPPED); an admin/Dockerfile-only push rebuilt only admin (backend+web SKIPPED).
**Gotchas recorded:** (a) the fully-in-code route (`railway config` / `.railway/railway.ts` TS-IaC) is
blocked in this env by a Railway CLI module-loader bug (query-string import fails even after CLI
upgrade) — reverted the SDK dep; (b) Railway `watchPatterns` match **gitignore-style**, so a bare
`Dockerfile` also matched `admin/Dockerfile`/`web/Dockerfile` and rebuilt the backend — fixed by
anchoring root-only inputs with a leading slash (`/Dockerfile`, `/.dockerignore`, `/pnpm-lock.yaml`,
`/pnpm-workspace.yaml`, `/tsconfig.base.json`). `driver`/`rider` are EAS (not Railway), so they never
trigger a Railway build. Earlier dead-ends (for the record): a shared-root `watchPatterns` union broke
isolation (all services read one file); and config-as-code does NOT override a dashboard Watch-Paths
override (had to clear the backend's `backend/**` dashboard override).

### chore · infra · Clean CI/CD pipeline + Railway migration cutover — 2026-08-04

**What:** Replaced prod `DB_SYNCHRONIZE=true` with TypeORM migrations — committed a self-contained
baseline (creates `uuid-ossp` + 30 tables), wired `migrationsRun` on boot when synchronize is off;
wiped the disposable prod DB and cut over live (migration builds the schema on boot, admin reseeded,
prod login verified). One lean-ish backend Dockerfile (deleted the broken alt), Node pinned to 22.13.1
across `.nvmrc`/Dockerfiles/CI, `.next` cached in turbo. Admin + web now build for Railway (Next
standalone + root-context Dockerfiles, verified). CI typechecks all 7 workspaces (was never run).
**Notes:** All three services now live on Railway (one platform): backend + admin
(`admin-production-02d3.up.railway.app`) + web (`web-production-9558c.up.railway.app`) + Postgres +
Redis + bucket. Admin login verified end to end through its proxy → backend on Railway. Five real
gotchas fixed along the way: (1) pinned-Node corepack ships stale signing keys → install pnpm via npm;
(2) composite-TS `.tsbuildinfo` leaked into the Docker context → excluded in `.dockerignore`;
(3) Next standalone binds `process.env.HOSTNAME` (Docker's container id) → set `HOSTNAME=0.0.0.0` as a
Railway service var (a Dockerfile ENV is overridden at runtime); (4) the Next apps had no `/health`
route for Railway's healthcheck → added one (whitelisted in admin middleware); (5) THE big one — root
`railway.json` `dockerfilePath: Dockerfile` was forcing the backend image onto every service, so
admin/web ran the backend and crashed → removed it so per-service `RAILWAY_DOCKERFILE_PATH` wins.
Follow-ups: delete the two Vercel projects (now unused; CORS already moved to Railway); broaden the
backend service's watch path (`backend/**`) so root `Dockerfile`/`packages/types`/`railway.json` changes
trigger a backend rebuild instead of SKIPPED; backend image is 1.7GB (fat COPY, could slim later).

### feature · backend+rider · Subscription v2: route pricing + free-at-use (spec 0004) — 2026-08-03

**What:** Subscriptions are now priced from the rider's own route (formula over the ECONOMY quote fare;
preview endpoint so clients never compute money) and charged upfront; SOLO rides matching the route
(≤1km endpoints, either direction) are free at use — rider pays nothing, driver's normal net is funded
from prepaid REVENUE (`settleRide` gains `source: 'subscription'`), covered rides forced to WALLET
(cash double-pay hole closed), `ridesUsed` metered, `coveredBySubscription` on the ride view. Rider
subscription screens were discovered to be running on a local placeholder store — now wired to the real
API (store + dead lib deleted; home tab card included). Shared `common/geo.ts` haversine (carpools
switched to it).
**Notes:** Runtime-verified end-to-end incl. ledger legs and Σ(wallets)=0. Static plan catalog still
listed but unoffered (cleanup follow-up). Scheduler/fallback/frequency are later slices. Fee constants
and 1km radius are founder-tunable (spec 0004 follow-ups). Graphify study slice A2 — the unwired
screen was found by a graph degree-1 query.

### feature · backend+rider · Carpool v2: discounted ride-share fares (spec 0003) — 2026-08-03

**What:** Equal split replaced by occupancy-discounted own fares (1.0/0.8/0.7/0.65 of solo fare;
alone = full). `recompute` prices per member; settlement charges stored shares with commission on the
collected total (remainder loop deleted); view adds server-computed `projectedShare` + `collectedTotal`;
rider app renders server values only (inline split math removed, share keyed by own membership,
CANCELLED hides the split card).
**Notes:** Runtime-verified end-to-end incl. ledger legs and Σ(wallets)=0. Discount curve values are
founder-tunable defaults (spec 0003 follow-up). Wallet→card fallback still out of scope. Graphify study
slice A1.

### feature · types+backend+admin · Shuttle v2: ops route assignment (spec 0002) — 2026-08-03

**What:** New `shuttle:assign` permission in `@kari/types` (OPS + SUPER_ADMIN); `shuttle_routes` gains
`assignedDriverId`/`busPlateNumber`/`busLabel`; `PATCH /admin/shuttle/routes/:id/assignment` (assign or
clear, DEDICATED+ACTIVE validation, one-driver-one-route 409, transactional stamping of future
SCHEDULED trips, audit-logged) + `GET /admin/shuttle/routes`; seeder now stamps new trips from the
route assignment; admin gets a Shuttle page (assign/clear, `<Can>` gated).
**Notes:** Runtime-verified 9/10 ACs incl. reseed inheritance via live-schema queries; admin page
browser pass pending per convention. ShuttleModule now exports ShuttleService (AdminModule imports it).
Part of the Graphify study.

### feature · backend+driver · Carpool v2: driver carpool-mode toggle (spec 0001) — 2026-08-03

**What:** `carpoolMode` on `driver_profiles`; `POST /availability/carpool-mode` (403 for dedicated);
`findCandidates` gains an `opts` eligibility filter (`requireCarpoolMode`, `driverType`) with a widened
GEO over-fetch window; carpool dispatch now targets only opted-in freelance drivers; driver home tab
gets the opt-in switch (freelance only, optimistic, hydrated from `/drivers/me`).
**Notes:** Runtime-verified AC-1–AC-6 against a live backend (dispatch counts observed); driver-app UI
device pass pending per convention. Also enforces the first piece of the ride-type-matrix eligibility
rule in code — solo dispatch still has no driverType filter (follow-up in spec 0001). Part of the
Graphify before/after study (docs/graphify-study/log.md).

### docs · context · Context system rebuilt around foundation.md — 2026-07-30

**What:** Derived `foundation.md` (v1, converged) from the codebase; added `build-graph.md` +
`progress-log.md`; retired `progress-tracker.md` (gaps → build-graph, history → below); repointed all
cross-references.
**Notes:** Build constraints confirmed with founder: solo, part-time, real venture (foundation §0, §3).

### fix · backend · Admins exempt from login OTP (2FA) — 2026-06-23

**What:** Admin email/password login no longer requires the OTP second factor (foundation §7 #7).

### feature · admin · Admins & Roles page — 2026-06-23

**What:** `admins/page.tsx` built: list admins, invite, change role, change status. Replaces the
long-standing ComingSoon stub — admin A0–A6 now fully built.
**Notes:** Not yet runtime-verified (see build-graph → verification).

### feature · rider · Pixel-perfect Figma redesign + negotiate mode + account tab — 2026-06-22

**What:** Full rider visual redesign to the _Kari Mobile App_ Figma file (R0–R5): onboarding, app
screens, wallet tip flow, negotiate "name your price" mode (keyboard Done bar), account tab
(Figma 1443:6801) + settings sub-screens (addresses, language, music, personal-info, driver-type).
**Notes:** EAS dev-build config updated (app.config.js injects Maps key; eas.json env mapping).

### feature · backend · OTP on re-login (2FA) + longer-lived sessions — 2026-06-18

**What:** Re-login now requires OTP for riders/drivers; session TTLs lengthened. JSON body limit raised
for selfie/document uploads.

### docs · context · Cross-cutting + per-product context system — 2026-06-17

**What:** Added root `context/` docs and per-product `context/` folders (backend/rider/driver/admin/web).
**Notes:** Rider+driver dropped unloaded Poppins for ArchivoExpanded/HankenGrotesk (design-token
compliance resolved).

### chore · infra · Railway backend deploy + EAS build pipeline — 2026-06-08/09

**What:** Backend deployed to Railway (Dockerfile, DATABASE_URL, configurable Swagger with basic auth);
rider + driver linked to EAS projects (dev-client, EAS Update, preview-sim profile, Node pinned 22.13.1,
`@kari/types` built in eas-build-post-install); apps pointed at the Railway backend.

### feature · admin · A2–A6: live fleet, actions+audit, dedicated drivers, tickets, financials — 2026-06-05

**What:** Live fleet map, audit interceptor + viewer, admin actions (suspend/verify/override),
dedicated-driver roster + onboard, multi-source tickets (app/web/email; in-app submit from both mobile
apps), financials (revenue/payouts/promotions/fare-config).
**Notes:** Committed, not runtime-verified.

### feature · rider+driver · Mobile P3–P6: money, engagement, variants, safety & comms — 2026-06-05

**What:** Wallet/payments + earnings, gamification + subscriptions, carpool + shuttle + NIN gate,
safety (panic, share-trip) + chat + notifications + support — both apps.
**Notes:** Committed, not device-verified (P0–P2 were device-verified via Expo Go).

### feature · backend · P5–P6: ride variants + safety & comms — 2026-06-05

**What:** Carpooling (NIN-gated, cost-split, @VersionColumn), shuttle (Lekki/Aba routes seeded, seat
inventory); notifications via BullMQ, panic SMS, share-trip (public token, 12h TTL, PIN hidden), in-ride
chat, masked calls.
**Notes:** E2E: P5 23/23, P6 20/20 (incl. ledger invariant).

### feature · backend · P3–P4: money + engagement — 2026-06-04

**What:** Double-entry wallet/ledger (kobo, Σ=0), Paystack behind PaymentProvider, commission 20%
leaderboard-reduced, cancellation penalties, idempotent settlement; gamification (scores/badges/
leaderboard), referrals, subscriptions (static plans, sticky driver).
**Notes:** E2E-verified: ledger invariant asserted; leaderboard leader settles at 19%.

### feature · platform · P0–P2 + web + brand: foundation through core rides — 2026-06-04

**What:** Monorepo (pnpm+Turbo), `@kari/types`, backend P0–P2 (auth/OTP/Google, KYC, NIN/liveness,
matching via Redis GEO, tiered+traffic pricing, ride state machine, negotiation, start-PIN, socket
dispatch, mutual ratings), rider + driver P0–P2, admin A0–A1, marketing web (8 sections, light theme),
brand kit (Hanken/Archivo-Expanded/Geist).
**Notes:** Backend P2 verified 29/29 via E2E simulator; mobile P0–P2 device-verified; admin login
verified with seeded admin (`admin@kari.test`).

---

## Verification ledger (carried from progress-tracker.md)

**Verified:** backend P0–P6 (E2E: P2 29/29 · P3 ledger Σ=0 · P4 19% commission · P5 23/23 · P6 20/20) ·
rider P0–P2 (device, Expo Go) · driver P0–P2 (device; iOS bundle ~10.5 MB) · admin A0–A1 (build + login).
**Built, unverified:** rider P3–P6 · driver P3–P6 · admin A2–A6 + Admins & Roles · rider Figma redesign.
