# Kari — Foundation

> **Status:** v1 — converged. Last updated 2026-07-30. Derived from the existing codebase and hand-built
> context docs (brownfield); build constraints and goals confirmed with the founder.
> **Source of truth.** Every other file references this; none restate it. If any file — or any per-app
> `ARCHITECTURE.md` — disagrees with this one, this one wins. Where a doc and the *code* disagree on an
> implementation detail, the code embodies the decision and the doc is the bug (see §7 #10, #12 for
> examples already caught).
> The name **Kari** is locked (brand assets shipped in `brand/`).

## §0 Build constraints

- **Solo founder, part-time.** One person builds alongside other commitments, working through AI-agent
  sessions. Implication: **one slice at a time, finished fully** — scope discipline is survival, not
  style. No collaboration layer (no COLLAB.md, single progress log file).
- **Budget:** bootstrap-lean. Infra runs on Railway + managed Postgres/Redis; third-party providers are
  keyless noops until launch demands the real integration (§9).
- **Skills:** TypeScript end-to-end is the chosen lane — one language, one mental model, every surface.

## §1 What it is

**Kari is an Uber-like ride-hailing platform built for Nigeria's socio-economic realities** — four
products (rider app, driver app, admin console, marketing web) around one backend.

The wedge is not "ride-hailing exists" — incumbents (Bolt, Uber, inDrive) already operate in Nigeria. The
wedge is a bundle tuned to local reality that incumbents don't offer together: **dedicated (salaried)
drivers** enabling **subscribed routes** with a sticky driver; **fare negotiation** with no floor;
**fixed-route shuttles**; a **double-entry wallet** that works when bank transfers fail mid-payment;
**NIN-based trust** and a safety suite (ride-start PIN, panic SOS, masked calls, live trip-sharing); and
**gamified driver economics** where leaderboard standing lowers real commission.

## §2 Who it's for

- **Riders:** Nigerian urban commuters (Lagos/Aba corridors first) — phone-first, price-sensitive,
  wary of payment failures and safety, many with a fixed daily home↔work pattern that subscriptions serve.
- **Drivers:** freelance drivers who self-onboard and earn per trip, and dedicated drivers hired and
  managed by Kari ops (salaried, reservable for subscription routes and shuttles).
- **Kari ops staff:** run the fleet, KYC, disputes, tickets, and money through the admin console.

## §3 Success & stage

- **Success = a real venture launched in Nigeria.** Not a portfolio piece. Hardening, real provider
  integrations, and store builds are on the critical path.
- **Stage:** MVP is code-complete across all four surfaces (backend P0–P6, mobile P0–P6, admin A0–A6
  including Admins & Roles, marketing web). Backend is deployed to Railway; EAS build pipeline configured.
  What remains before launch: **P7 hardening**, **runtime verification** of the later phases, **real
  provider implementations** (9 of 10 are noops), and the ride-variant v2 gaps (§8).

## §4 Guiding principles

1. **Built for Nigeria, not localized to it.** Fare math factors fuel and traffic; identity is
   phone + OTP + NIN (no email/password for riders/drivers); money is naira/kobo; maps are Nigeria-scoped.
2. **One language, one repo, shared types.** TypeScript everywhere; `@kari/types` is the single contract
   between backend and every client. (The monorepo consolidated 8 legacy repos — the split was a hiring
   artifact, not a design.)
3. **Explicit over magic.** Self-issued JWT over Cognito; scrypt over a native-dep hash; hand-rolled
   admin cookie auth over NextAuth; visible failure modes everywhere.
4. **Every external service behind an interface.** Modules never import vendor SDKs; every provider has
   a keyless noop so the full stack runs with zero credentials (§9).
5. **Money is sacred.** Double-entry ledger, kobo minor-units, idempotent settlement, Σ(all wallets) = 0
   asserted by E2E.
6. **Safety is a product surface, not a checkbox.** PIN-to-start, panic, masked calls, trip-sharing are
   core flows with the same engineering bar as booking.
7. **Scope is sacred.** Solo part-time (§0): one feature at a time, finished and verified, logged.

## §5 Core model

The central object is the **Ride** — a state machine (`SEARCHING → … → COMPLETED`, guarded transitions,
`@VersionColumn` optimistic locking, first concurrent actor wins). Around it:

- **Users** carry one role (RIDER / DRIVER / ADMIN). Drivers split into `FREELANCE` (self-onboarded,
  KYC-gated before going online) vs `DEDICATED` (admin-onboarded, salaried).
- **Ride types:** `SOLO`, `CARPOOL` (NIN-gated, multi-rider), `SHUTTLE` (fixed routes, dedicated
  drivers), `SUBSCRIPTION` (sticky dedicated driver, prepaid). **Matching eligibility is the
  load-bearing rule:** each type dispatches only to its eligible driver pool
  (see `architecture.md` → Ride Type Matrix).
- **Pricing:** `STANDARD` (3 car classes: Economy/Comfort/Premium) vs `NEGOTIATE` (rider names a price,
  no floor, tier-agnostic; driver counters capped at standard fare) — Solo only.
- **Money:** every wallet change posts balanced debit/credit `ledger_entries`; two system wallets
  (`REVENUE`, `GATEWAY`); commission 20% base, reduced by leaderboard standing.
- **Trust artifacts:** ride-start PIN minted on driver accept (one per rider in carpool); NIN
  verification; selfie liveness; mutual ratings.

## §6 Core flows & surfaces

| Surface | Path | The flow it lives or dies on |
|---------|------|------------------------------|
| Rider app (Expo/RN) | `rider/` | book → match → PIN start → track → pay (wallet/card/cash) → rate |
| Driver app (Expo/RN) | `driver/` | KYC wizard → go online → dispatch sheet → accept/counter → enter PIN → complete → earnings |
| Admin console (Next.js) | `admin/` | live fleet map · KYC/lifecycle management · trip override · tickets · financials · audit-logged RBAC |
| Marketing web (Next.js) | `web/` | static single-page site (light theme, no backend by design) |
| Backend (NestJS) | `backend/` | one unified API + Socket.IO server behind everything |

Full narrative user stories: `project-overview.md`. Per-type ride contracts: `architecture.md`.

## §7 Locked decisions

Numbered so other files can cite `foundation.md §7 #N`. These were made during the build and are embodied
in the code; reasoning is recorded so no session re-litigates them.

| # | Decision | Reasoning | Rejected alternative |
|---|----------|-----------|----------------------|
| 1 | **Monorepo: pnpm 11 + Turborepo**, TypeScript strict end-to-end | One language/one repo for a solo founder; consolidates 8 legacy repos whose split was a hiring artifact | Keeping split repos (NestJS + Java backends, RN + Flutter mobile) |
| 2 | **Backend: NestJS 11** on Node 24, PostgreSQL 16 + TypeORM, Redis 7 | Batteries-included DI/modules suit a large domain; TS keeps types shared | Java/Spring legacy backend |
| 3 | **Mobile: Expo SDK 54 + React Native 0.81**, Expo Router v6, Zustand + TanStack Query, NativeWind 4 | One React mental model shared across rider/driver via `@kari/mobile-core`; EAS handles store builds | Flutter (legacy driver app) |
| 4 | **Admin: Next.js 15 App Router**, Tailwind 3 + shadcn/ui, dark theme | Server Components for read-heavy ops pages; shadcn = fast, ownable UI | Separate SPA / legacy admin |
| 5 | **Auth: self-issued JWT** (access 15m + rotating refresh 30d) | Stateless, no vendor lock, full control of claims | AWS Cognito (dropped) |
| 6 | **Passwords: scrypt** (Node built-in, `salt:hash` hex, constant-time compare) | Zero native dependency — builds anywhere incl. EAS | Argon2id (needs native build; docs claiming it were aspirational) |
| 7 | **2FA: OTP required on re-login** for riders/drivers; **admins exempt** (email/password + httpOnly cookie) | Phone possession is the trust anchor for the field; admins are staff on trusted devices | OTP for everyone (friction without threat-model gain) |
| 8 | **Identity: phone + OTP (SMS Termii / WhatsApp Twilio) + Google sign-in; no email/password** for riders/drivers | Phone-first is how Nigeria authenticates; email is low-trust there | Email/password accounts |
| 9 | **Payments: Paystack** behind `PaymentProvider` | Dominant NG gateway; interface keeps Flutterwave swappable | Flutterwave as primary |
| 10 | **Socket model: per-user rooms only** (`user:{id}`, JWT-authed; `'ops'` room for panic is the sole exception) | One fan-out primitive (`emitToUser`) covers every event; no room-lifecycle management | `ride:{id}`/`driver:{id}` rooms (older docs imply them; never built) |
| 11 | **Money: kobo minor-units, `bigint` columns, double-entry ledger**, Σ(wallets)=0, idempotent sync settlement; CASH rides collect commission from the driver wallet (may go negative) | Financial correctness is non-negotiable; invariant is E2E-asserted | Decimal naira, single-entry balances |
| 12 | **DB naming: snake_case plural tables, camelCase columns** | TS convention at the column level; TypeORM default table style | Full snake_case |
| 13 | **Optimistic locking (`@VersionColumn`) on Ride / Carpool / ShuttleTrip** | Contended objects; first actor wins, others get 409 — no pessimistic lock queues | Row locks / serializable transactions |
| 14 | **One active ride per rider**, enforced at the API (409) | Product simplicity + fraud surface reduction | Multiple concurrent bookings |
| 15 | **Provider abstraction: 10 interfaces in `providers/contracts.ts`**, every one with a keyless noop; real impls added per provider when launch demands | Full stack runs with zero credentials; vendors swap by config | Direct SDK imports in modules |
| 16 | **Commission: 20% base BPS, leaderboard-reduced** (top 3 → 19%) | Gamification wired to real earnings, not vanity points | Flat commission |
| 17 | **Personality quiz: 1–5 Likert**, scored to TALKATIVE/RESERVED/NEUTRAL | User feedback: 3-point scale too coarse | 3-point scale (original) |
| 18 | **`@kari/mobile-core` is source-shipped** (Metro/Babel transforms it; no build step); `@kari/types` is built (`dist/`) | NativeWind classnames must be compiled per-app; types need one canonical artifact | Building mobile-core / source-shipping types |
| 19 | **Admin auth: custom httpOnly-cookie + same-origin proxy** (`/api/proxy/[...path]` injects Bearer) | Token never touches client JS; no NextAuth complexity | NextAuth/Auth.js, Zoho SSO (stubbed only) |
| 20 | **Design: dark theme (mobile + admin), brand yellow `#FFFF00` on near-black `#070707`; web is the one light surface** with its own tokens; rider UI's visual source of truth is the Figma file *Kari Mobile App* | High-contrast brand DNA; marketing needs approachability | Light mobile apps; shared web/mobile tokens |
| 21 | **Deploy: backend on Railway** (Dockerfile, `DATABASE_URL`), mobile via **EAS** (dev-client + EAS Update, Node pinned 22.13.1) | Lowest-ops path for a solo founder; EAS is the Expo-native store pipeline | Self-managed AWS from day one |
| 22 | **Jobs: BullMQ on Redis** — never `setTimeout`; durable record persisted synchronously, side-effects queued | Jobs survive restarts; Redis already in the stack | In-process timers, cron-only |

A decision made mid-build that changes any of these updates this table **first**, then ripples (see
`progress-log.md` standing instruction).

## §8 Scope

### In (v1 / launch)
Everything in §6, plus: P7 hardening (a11y, offline/error states, perf, Maestro e2e, store builds);
runtime verification of mobile P3–P6 and admin A2–A6; real provider implementations; and the **ride-variant
v2 gaps** already specced in `architecture.md` → Ride Type Matrix (carpool: mode toggle, per-rider PIN,
incremental dispatch, discounted ride-share fares, route optimization · shuttle: QR board/alight,
ops bus/route assignment · subscription: scheduler job, fallback chain, per-route pricing, free-at-use).

### Out / cut (the forcing function)
Autonomous vehicles · multi-country (Nigeria only) · email/password auth for riders/drivers · crypto
payments · third-party delivery/logistics · in-app driver-training product · scheduled one-off rides ·
multiple active rides per rider.

### Deferred (roadmap, tracked not built)
Full Spotify account integration + playlist sharing (today: preference setting + manual link share) ·
"Kari Wrapped" · watchlist address + push · emergency car-alarm integration · fare-split with friends
(social graph) · marketing-email campaigns (distinct from transactional `EmailProvider`) · Flutterwave
as payment alternative.

## §9 Architecture keystones

- **The keystone unlock (already built): the unified backend + `@kari/types` contract.** Every surface
  speaks one API envelope (`ApiResponse<T>`) and one enum vocabulary — this is what made four products
  buildable by one person.
- **The keyless-dev pattern:** noop providers auto-succeed (OTP logs to console, payments settle
  instantly), so any session can run the entire stack with no credentials. Real impls slot in per
  provider without touching modules (§7 #15).
- **Matching eligibility as the load-bearing rule** (§5): the matching path filters by `driverType` ×
  ride type. Carpool/Subscription dispatch is multi-step, unlike the single-offer Solo path.
- **Tenancy/isolation:** single-tenant platform; the boundary that matters is **role + ownership** —
  every query scoped to the current user, admin routes behind `PermissionsGuard` + audit logs, socket
  events only to participants' `user:{id}` rooms.
- Detail lives in `architecture.md`; the *why* stays here.

## §10 Known scale seams

Accepted as not-scaling for now — with the replacement named:

- **Redis GEO matching** scans nearby drivers per request; fine for launch density, replaced by a
  proper dispatch service (batching, supply forecasting) when volume demands.
- **One BullMQ queue (`notifications`)** — OTP-expiry/commission/leaderboard queues are stubbed in
  comments, not registered. Register real queues as those jobs move off the request path.
- **Synchronous settlement** in the ride-completion request; moves to a queued job if gateway latency
  bites.
- **Single Railway backend instance**; Socket.IO already has the Redis adapter, so horizontal scale is
  config, not rearchitecture.
- **Seeded shuttle routes** (Lekki + Aba, seeded on boot) until ops manages routes in admin.
- **scrypt at Node default cost (N=2¹⁴)** — a P7 parameter bump to OWASP guidance (N≥2¹⁷), not a rewrite.

## §11 The deepest risk

**Supply-side economics.** The differentiators riders would pay for — subscriptions with guaranteed
pickup, shuttles, sticky drivers — all depend on **dedicated (salaried) drivers**, which is a
capital-intensive bet a bootstrap solo founder must get right: too few and subscriptions break their
guarantee (the product's core promise); too many and payroll sinks the venture before liquidity arrives.
Freelance-side liquidity against entrenched incumbents (Bolt, inDrive) is the secondary face of the same
risk. Everything else — stack, providers, hardening — is execution.

## §12 Open questions

- 🕗 **Push provider:** Expo Push vs FCM (decision owed in P7, before store builds; `PushProvider`
  contract already exists).
- 🕗 **Transactional email provider:** AWS SES is penciled in (noop today) — confirm before building the
  real `EmailProvider` impl.
- 🕗 **Admin accent color:** brand yellow vs purple (design-tokens.md marks it TBD).
- 🕗 **Dedicated-driver operations:** hiring/training/payroll process is an ops design (not code) that
  §11 depends on — undesigned.
- 🕗 **Launch corridor:** Lekki vs Aba first (shuttle routes exist for both; marketing and dedicated-driver
  hiring need one to start).
