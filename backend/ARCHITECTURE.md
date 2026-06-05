# Kari Backend — Architecture

> **Status:** Draft v1 · **Date:** 2026-06-02 · **Stack:** NestJS + TypeScript
> This document is the single source of truth for the unified Kari backend. It supersedes the two
> legacy backends (`KariBackend` / NestJS, `kariBackendJava` / Spring Boot), carrying forward the
> best of each and adding the scope defined in the MVP Requirements Specification (v1.0, 2025-01-14).

---

## 1. Purpose & Goals

Kari is a ride-sharing platform tailored to Nigeria, connecting **freelance and dedicated drivers**
with **riders**, with negotiated pricing, KYC-gated trust, gamified driver earnings, and ride
variants (solo, carpool, shuttle, subscription).

This backend is a **from-scratch unified rewrite**. It is not a port of either legacy system. It
takes the **architecture** of the Java backend (which was the more production-minded design), the
**framework hygiene** of the NestJS backend, and implements the **full MVP scope** from the
requirements document.

Design goals, in priority order:

1. **Correctness under concurrency** — two drivers must never win the same ride; money must never be lost.
2. **One language, one source of truth** — TypeScript end-to-end; self-issued identity; no dual datastores for the same data.
3. **Real-time at peak** — targeted dispatch, horizontally scalable sockets, low latency.
4. **Trust & safety first** — KYC/NIN verification, ride-start OTP, panic, trip sharing are core, not bolt-ons.
5. **Buildable in phases** — every phase ships something testable; no big-bang.

---

## 2. Lineage — What We Carry Forward

| Concern | Legacy NestJS | Legacy Java | **Decision for Kari** |
|---|---|---|---|
| Framework | NestJS | Spring Boot | **NestJS** (TS everywhere) |
| Identity | AWS Cognito, 2 user pools | Self-issued JWT | **Self-issued JWT** (access + refresh) |
| Primary DB | Postgres **+ MongoDB** | MySQL | **PostgreSQL only** |
| Cache / ephemeral | — | Redis (price quotes) | **Redis** (quotes, live geo, sockets, queues) |
| Real-time | Socket.IO broadcast (all→all) | STOMP, targeted, JWT-auth | **Socket.IO, targeted rooms, JWT-auth, Redis adapter** |
| Concurrency | none | optimistic locking (`@Version`) | **Optimistic locking** |
| Transactions | hollow / abandoned | real `@Transactional` | **Real transactions** (QueryRunner + ledger) |
| Matching | none | geo-radius dispatch | **Redis GEO + multi-factor matching** |
| Pricing | none | distance × duration, tiered, negotiable | **Extended**: + traffic + fuel factor |
| KYC | none | S3 + Rekognition liveness | **Carry + add NIN verification** |
| Validation | global `ValidationPipe` ✓ | none | **Carry from NestJS** |
| Error handling | global filter ✓ | ad-hoc | **Carry from NestJS** |
| OTP channels | SMS **+ WhatsApp** ✓ | SMS only | **Carry multi-channel from NestJS** |
| Config validation | none | properties | **Add Zod-validated config** (fix both) |

**Net:** Java's architecture + NestJS's hygiene + multi-channel OTP + the full MVP feature set.

---

## 3. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime / language | Node.js LTS, TypeScript (strict) | One language across backend, web, mobile |
| Framework | NestJS | Modules, DI, guards, first-class WebSocket & validation |
| ORM | TypeORM | Carries from NestJS; migrations; QueryRunner for real txns |
| Primary DB | PostgreSQL | Relational integrity for money/identity; PostGIS-ready for geo |
| Cache / ephemeral | Redis | Price quotes (TTL), **live driver geo-index (GEO)**, socket adapter, BullMQ backend |
| Jobs / async | BullMQ (Redis) | OTP expiry, commission calc, leaderboard, billing, notification fan-out (replaces `setTimeout` hack) |
| Realtime | Socket.IO + `@socket.io/redis-adapter` | Targeted rooms, JWT-auth, horizontal scale at peak |
| Auth | JWT (access + refresh), Passport, Argon2 | Self-issued, stateless, rotating refresh |
| Object storage | AWS S3 | Driver documents (carry from Java) |
| Identity/liveness | AWS Rekognition Face Liveness | Carry from Java; >0.9 confidence gate |
| NIN / KYC | Pluggable; **Dojah** primary | NG-focused NIN/BVN verification (locked 2026-06-02) |
| Payments | Pluggable; **Paystack** primary | Nigeria-first DX; Flutterwave as alt impl (locked 2026-06-02) |
| Maps / traffic | Google Maps (Distance Matrix + traffic) | Carry from Java; traffic factor for pricing |
| SMS | Pluggable; **Termii** (NG) | NG-optimized delivery + OTP templates (locked 2026-06-02) |
| WhatsApp | Twilio | Carry from NestJS |
| Push | Expo Push (mobile is Expo RN) / FCM | Matches chosen mobile stack |
| API docs | Swagger / OpenAPI | Carry from both |
| Rate limit / bot | `@nestjs/throttler` (+ Arcjet optional) | Abuse protection on OTP/auth |
| Logging | pino (structured) + request IDs | Observability from day one |
| Testing | Jest (unit) + Supertest (e2e) | Carry from NestJS |
| Local infra | Docker Compose (Postgres + Redis) | Reproducible dev |

---

## 4. Architectural Principles

1. **Two-tier services** (from Java). Each domain has an *orchestration service* (talks to sockets,
   Redis, pricing, providers) and a *data service* (owns DB access + transaction boundaries).
   Controllers stay thin.
2. **One identity, role-scoped profiles.** A single `User` (auth identity) with role-specific
   `DriverProfile` / `RiderProfile`. No separate identity pools; no duplicate identity stores.
3. **Money is double-entry.** Every balance change is a `LedgerEntry`. Wallets are projections of the
   ledger, never mutated directly. All money ops are transactional.
4. **Optimistic locking on contended writes** — ride acceptance, carpool seat claims, wallet debits.
5. **Provider abstraction.** Payments, SMS, KYC, maps, storage, push each sit behind an interface;
   concrete vendors are swapped via config. No vendor IDs hardcoded in services (fixes a NestJS smell).
6. **Ephemeral data in Redis, durable data in Postgres.** Live driver positions, price quotes, OTP
   state, and socket fan-out live in Redis with TTLs. Everything auditable lives in Postgres.
7. **Async by queue, not by timer.** Anything fire-and-forget (notifications, commission recompute,
   subscription billing) goes through BullMQ.
8. **Validate at the edge.** Global `ValidationPipe` + class-validator DTOs; Zod-validated env config
   at boot.
9. **Fail uniformly.** Global exception filter normalizes DB, provider, and domain errors to one
   response shape.
10. **Enums as strings in DB** (from Java) — human-readable schema, safe to extend.

---

## 5. System Architecture

### 5.1 Request path (HTTP)
```
Client → Guard (JWT + role) → Controller (thin) → OrchestrationService → DataService (@Transactional) → Repository → Postgres
                                                          ↓
                                            Providers / Redis / Queue / Socket
```

### 5.2 Realtime path (WebSocket)
```
Client --CONNECT(JWT)--> Gateway (auth middleware) → joins room user:{id}, role rooms
Ride events → SocketService.emitTo(user:{driverId}, ...)        # targeted, never broadcast
Multi-instance fan-out → Redis adapter (pub/sub) → all nodes
```

Rooms: `user:{userId}`, `ride:{rideId}`, `carpool:{id}`, `shuttle:{tripId}`. Subscriptions are
authorized against JWT claims (closes the Java "TODO: restrict subscriptions" gap).

### 5.3 Matching flow (the core loop)
```
1. Rider requests quote   → Pricing computes (distance+duration+traffic+fuel) → cache in Redis (15-min TTL, ref code)
2. Rider books with ref   → validate quote freshness → create Ride (status=SEARCHING)
3. Matching               → Redis GEO query: drivers within radius
                            → filter: availability, car class, personality preference, dedicated-vs-freelance
                            → rank → dispatch offer to each candidate's room
4. Driver accepts         → optimistic-lock Ride (first wins; others get "already assigned")
   (optional negotiation) → rider proposes price (no floor) → driver counters (within cap) → accept/reject
5. Driver arrives         → rider's ride-start OTP → driver enters → Ride status=IN_PROGRESS
6. Complete               → fare settled → commission split → wallets credited → ratings prompted
```

---

## 6. Data Architecture

### 6.1 What lives where
| Store | Data |
|---|---|
| **Postgres** | Users, profiles, vehicles, rides, negotiations, ledger/wallets, transactions, subscriptions, shuttle routes/stops, carpools, leaderboards, achievements, commission rules, ratings, chat messages, documents (metadata), saved addresses, emergency contacts |
| **Redis** | Live driver positions (GEO), price quotes (TTL), OTP state (TTL), socket adapter pub/sub, BullMQ queues, rate-limit counters |
| **S3** | Driver/rider document binaries (license, NIN card, car photos, profile photo) |

### 6.2 Core entities (overview)
- **User** — id, role(`DRIVER`/`RIDER`/`ADMIN`), email, phone, passwordHash, status, verification flags.
- **DriverProfile** — userId, **driverType(`FREELANCE`/`DEDICATED`)**, personality(`TALKATIVE`/`RESERVED`/`NEUTRAL`), onboarding status, DOB, origin, NIN status, KYC/liveness status, payment details, walletId, referralCode, ratingAvg.
- **RiderProfile** — userId, preferredDriverBehavior, savedAddresses(home/work), card token (gateway ref), walletId, ninStatus, ratingAvg.
- **Vehicle** — driverId, model, plate, particulars, photos[].
- **Ride** — type(`SOLO`/`CARPOOL`/`SHUTTLE`/`SUBSCRIPTION`), status, pickup/dropoff (geo), riderId, driverId, quotedPrice, agreedPrice, **startOtpHash**, `@Version`, locationHistory.
- **RideNegotiation** — rideId, driverId, proposedPrice, counterPrice, accepted.
- **Wallet** + **LedgerEntry** — double-entry; wallet balance = sum(ledger).
- **Transaction** — gateway payment/payout records (Paystack refs), status.
- **CommissionRule** / **CommissionRate** — base rate + leaderboard-driven reductions.
- **Subscription** — riderId, plan, route, **assignedDriverId** (same-driver trust), billing cycle.
- **ShuttleRoute** / **ShuttleStop** / **ShuttleTrip** — fixed routes & stops (Lekki/Aba corridors).
- **Carpool** — members[], costSplit, ninGate.
- **LeaderboardEntry** / **DriverScore**, **Achievement** / **Badge**.
- **Rating** — mutual driver↔rider.
- **ChatThread** / **Message**.
- **EmergencyContact** / **PanicEvent** / **SharedTrip**.
- **Document** (S3 ref), **DeviceToken** (push).

---

## 7. Identity & Authentication

- **Self-issued JWT** (HS256 or RS256), short-lived **access** + rotating **refresh**. No Cognito.
- One `User`; `role` claim + `userId` in token. Guards: `@Roles(DRIVER|RIDER|ADMIN)`.
- Passwords hashed with **Argon2id**.
- **Signup OTP** (SMS/WhatsApp) verifies phone before account activation.
- **Auth factors per requirements:** OTP + security questions server-side; **fingerprint / Face ID are
  device-side** (mobile unlocks a stored refresh token) — backend treats them as a trusted-device signal.
- **KYC gating:** drivers cannot go online until liveness + document checks pass; carpool participation
  requires **NIN verification**.
- WebSocket auth: JWT validated on CONNECT; room subscriptions authorized against claims.

---

## 8. Module Catalog

Each module = orchestration service + data service + controller(s) + entities. MVP scope noted.

| # | Module | Responsibility | Key decisions | Source |
|---|---|---|---|---|
| 1 | **Auth** | Signup, login, JWT access/refresh, password, signup-OTP | Self-issued, Argon2, refresh rotation | Java model + Nest OTP |
| 2 | **Identity / KYC** | Document upload (S3), Rekognition liveness, **NIN verification**, verification gating | Pluggable KYC provider; liveness hard-gate | Java + new (NIN) |
| 3 | **Drivers** | Profile, **freelance vs dedicated**, multi-step onboarding, **personality quiz**, vehicle, availability | Driver-type drives onboarding path & dispatch eligibility | Java + req |
| 4 | **Riders** | Light onboarding, **driver-behavior preference**, saved addresses, card token | Low friction (req); preference feeds matching | Java + req |
| 5 | **Rides** | Lifecycle state machine, **ride-start OTP**, ratings, location history, cancellation | Optimistic lock on accept; OTP to start | Java + req |
| 6 | **Matching** | Redis GEO radius + availability + car class + **personality** + driver-type | Targeted dispatch, never broadcast | Java geo + req |
| 7 | **Pricing** | Distance × duration, **traffic + fuel factor**, tiers (Economy/Comfort/Premium), **negotiation** (rider floorless, driver capped), carpool cost-split | Quote cached in Redis 15 min | Java + req |
| 8 | **Payments** | Gateway (Paystack), top-up, charges, **payouts**, **cancellation penalties** | Provider abstraction; idempotent | new (both stubbed) |
| 9 | **Wallet** | Double-entry ledger, balances, **fallback rail** when bank apps fail | All money txn'l; wallet = ledger projection | Java wallet + req |
| 10 | **Commission & Earnings** | Commission split, **leaderboard-driven reductions** (top 3 = −1%, weekly streak = extra) | Rate resolved per-ride from rules + standings | new (req) |
| 11 | **Gamification** | Leaderboard, achievements, milestones, badges | Feeds commission engine | req (both stubbed) |
| 12 | **Subscriptions** | Monthly plans by frequency/distance, **same-driver assignment**, auto-assign freelance/dedicated, billing | Trust = sticky driver | req (both stubbed) |
| 13 | **Shuttle** | Fixed routes, designated stops, schedules (Lekki/Aba) | Route+stop graph; seat inventory | new (req) |
| 14 | **Carpooling** | Initiate/join, cost-sharing, adjusted price if alone, **NIN gate** | Seat claims optimistic-locked | new (req) |
| 15 | **Safety** | **Panic button**, **share trip status** (public link), emergency contacts | Public read-only trip token | new (req) |
| 16 | **Communication** | In-app chat (WebSocket + persisted), **masked calls** (Twilio) | Reuse socket infra; numbers masked | new (req) |
| 17 | **Notifications** | Push (Expo/FCM), SMS, WhatsApp, email; templated, queued fan-out | All async via BullMQ | new (both stubbed) |
| 18 | **Admin** | **Dedicated-driver onboarding/management**, disputes, config, oversight | Admin role; server-driven onboarding | req |
| 19 | **Realtime (Gateway)** | Socket gateway, presence, Redis adapter, auth, room authorization | Cross-cutting; used by 5/6/12/13/14/16 | Java STOMP → Socket.IO |
| 20 | **Ratings** | Mutual driver↔rider ratings & aggregates | Affects leaderboard & matching | req |

**Minor attributes** (not full modules): driver "Spotify/Apple Music installed" attestation flag;
"reserved for subscribed routes" eligibility on dedicated drivers.

---

## 9. Cross-Cutting Concerns

- **Config** — `@nestjs/config` + **Zod schema** validated at boot; fail fast on missing/invalid env.
- **Validation** — global `ValidationPipe({ whitelist, transform })`, class-validator DTOs.
- **Errors** — global `ExceptionFilter`: maps TypeORM/QueryFailed, provider, and domain errors to a
  uniform `{ statusCode, message, error, timestamp, traceId }`.
- **Transactions** — `DataSource.createQueryRunner()` wrappers (or a `@Transactional` decorator);
  enforced on every multi-write op (onboarding, ride settle, money).
- **Logging / tracing** — pino, per-request `traceId`, propagated to logs and error responses.
- **Idempotency** — idempotency keys on payments and ride mutations.
- **Rate limiting** — throttler on auth/OTP endpoints; abuse counters in Redis.
- **Queues** — BullMQ for OTP expiry, notification fan-out, commission recompute, leaderboard
  rollups, subscription billing, document post-processing.
- **Testing** — unit per service, e2e per module flow; CI gate.

---

## 10. External Integrations (behind interfaces)

| Capability | Interface | Primary impl | Notes |
|---|---|---|---|
| Payments | `PaymentProvider` | **Paystack** | Flutterwave alt; cards, transfers, payouts |
| KYC / NIN | `IdentityProvider` | **Dojah** | NIN lookup + match |
| Liveness | `LivenessProvider` | AWS Rekognition | Carry from Java |
| Storage | `StorageProvider` | AWS S3 | Document binaries |
| Maps / traffic | `MapsProvider` | Google Maps | Distance, duration-in-traffic |
| SMS | `SmsProvider` | **Termii** | OTP + alerts |
| WhatsApp | `WhatsAppProvider` | Twilio | OTP alt channel |
| Voice (masked) | `VoiceProvider` | Twilio | In-ride masked calls |
| Push | `PushProvider` | Expo Push / FCM | Mobile notifications |

No provider IDs/keys in code — all via validated config; every provider has a `test`/`noop` impl for local + CI.

---

## 11. Non-Functional Requirements (mapped)

- **Scalability (peak):** stateless app nodes behind LB; Redis socket adapter; queues absorb spikes; Redis GEO for hot matching path.
- **Security:** Argon2, JWT rotation, KYC gating, ride-start OTP, idempotency, rate limiting, masked calls, least-privilege provider keys.
- **Performance:** targeted sockets (no broadcast), cached quotes, GEO index, async fan-out.
- **Usability:** consistent API envelope, OpenAPI docs, clear error shape.
- **Compliance:** Nigerian data handling (NDPR), NIN handled as sensitive PII (encrypted at rest, never logged, never in URLs), audit trail via ledger + event log.

---

## 12. Requirements Traceability

| Requirement (RSD v1.0) | Module(s) |
|---|---|
| Driver onboarding & profiling, personality quiz | Drivers, Identity/KYC |
| Freelance drivers (self-onboard) | Drivers |
| Dedicated drivers (admin-onboarded, salaried, subscription routes) | Admin, Drivers, Subscriptions |
| Earnings/wallet, leaderboard commission reductions | Wallet, Commission, Gamification |
| Order management within radius | Matching, Rides |
| Rate customers / view ratings | Ratings |
| Rider onboarding (+ optional card, home/work) | Riders |
| Ride preference: driver behavior type | Riders, Matching |
| Wallet fallback for bank failures | Wallet, Payments |
| Cancellation penalties | Rides, Payments |
| Pricing: distance + traffic | Pricing |
| Negotiation (rider floorless, driver capped) | Pricing, Rides |
| Security: identity (OTP/security Q/biometric) | Auth, Identity |
| NIN verification for carpooling | Identity/KYC, Carpooling |
| Ride-start OTP | Rides |
| Panic button, share ride status | Safety |
| In-app chat & calls, direct calls | Communication |
| Gamification: leaderboard, achievements, badges | Gamification |
| Shuttle logic (routes, stops) | Shuttle |
| Carpooling (initiate/join, cost-share) | Carpooling |
| Subscriptions (frequency/distance, same driver) | Subscriptions |
| Nigerian economy alignment (fuel + traffic) | Pricing |
| NFRs (scalability, security, performance, usability, compliance) | Cross-cutting / Infra |

**Post-MVP (KARI V1.0 roadmap):** Spotify partnership, "Kari Wrapped", watchlist address + push,
emergency car-alarm integration. Tracked, not built in MVP.

---

## 13. Decisions Log

**Locked 2026-06-02:**
1. **Monorepo tooling** — ✅ pnpm workspaces + Turborepo, shared `packages/types` consumed by backend + web + mobile.
2. **Payments** — ✅ Paystack primary (Flutterwave as future alt behind `PaymentProvider`).
3. **KYC/NIN** — ✅ Dojah primary.
4. **SMS** — ✅ Termii primary (WhatsApp via Twilio remains).

**Still open (decide just-in-time, before the phase that needs them):**
5. **Liveness** — keep AWS Rekognition, or consolidate into Dojah's liveness (decide in Phase 1).
6. **Push** — Expo Push (matches Expo RN) vs FCM directly (decide in Phase 6).
7. **Chat** — build on our WebSocket layer (MVP) vs managed (Stream/Sendbird) (decide in Phase 6).

**Phase 3 — Money (landed 2026-06-04):** modules 8–10 (Payments/Wallet/Commission) implemented as a single `MoneyModule`.
- **Unit = kobo (minor units).** All ledger/wallet/transaction amounts are integer kobo (bigint + numeric transformer); ride fares stay whole naira and convert at the boundary (×100). Matches Paystack's native unit — no rounding at the gateway.
- **Double-entry, projection balances.** `Wallet` + `Transaction` + `LedgerEntry`. Every change posts ≥2 balanced legs through `LedgerService.post` inside one DB transaction, pessimistic-locking each wallet row in a stable order; `wallet.balance` is a cached projection updated in that same txn (never mutated elsewhere). Idempotent by `Transaction.reference`. **Global invariant: Σ(all wallet balances) = 0** — asserted by the E2E.
- **System wallets:** `REVENUE` (commission + platform penalty share) and `GATEWAY` (clearing/contra for money in transit to/from Paystack; its negative balance = net funds held in user wallets). Lazily created.
- **Settlement on ride complete** (`PaymentsService.settleRide`, idempotent by `ride_{id}`): **CASH** (default) → platform collects commission *from the driver* (driver wallet may go negative = owes platform); **WALLET/CARD** → rider charged the full fare, driver paid net, platform keeps commission. Ride stores `commission` / `driverEarnings` / `settledAt`.
- **Commission:** base `COMMISSION_RATE_BPS` (default **2000** = 20%); `CommissionService.resolveRateBps(driver)` is the hook for Phase 11 leaderboard reductions (returns base for now). Split is exact (`driverNet = fare − commission`).
- **Cancellation penalty:** free before a driver is assigned or within `CANCELLATION_GRACE_SECONDS` (default 120); after that a rider cancel charges `CANCELLATION_FEE` (default ₦500) split `PENALTY_DRIVER_SHARE_BPS` (default 6000 = 60% to driver, rest to REVENUE); driver cancel charges `DRIVER_CANCEL_FEE` (default ₦0 = strike only). Best-effort — never blocks the cancel.
- **Top-up / payout:** top-up = PENDING txn → gateway `initiateCharge` → `verifyCharge`/webhook → GATEWAY-debit/user-credit (`settlePending`). Payout = reserve funds (driver-debit/GATEWAY-credit) → `initiateTransfer` → reverse on failure; `MIN_TOPUP` ₦100, `MIN_PAYOUT` ₦1000.
- **Provider:** `PaymentProvider` extended with `initiateTransfer`/`verifyTransfer`/`verifyWebhookSignature`. Real `PaystackPaymentProvider` (initialize/verify/transfer/recipient, HMAC-SHA512 webhook) selected when `PAYSTACK_SECRET_KEY` is set; otherwise the no-op auto-succeeds so dev/CI flows complete keyless. Webhook is `@Public()` + signature-verified over the raw body (`rawBody: true`).
- **Open for later phases:** real Paystack bank-code resolution for payouts (currently passes the stored bank field); async settlement via BullMQ if settle-on-complete becomes a hot path (synchronous + idempotent for now); rider/driver wallet UI (mobile).

**Phase 4 — Engagement (landed 2026-06-04):** modules 10–12 (Commission reductions / Gamification / Subscriptions) + referrals.
- **Gamification** (`GamificationModule`): `DriverScore` (per ISO-week + an `ALL` all-time bucket) and `Achievement` entities. Each completed ride awards `GAMIFICATION_POINTS_PER_RIDE` (default 10) and evaluates milestone badges (first / 10 / 50 / 100 rides, top-rated ≥4.8★ over ≥20 ratings). Weekly leaderboard ranks by points.
- **Commission reduction (closes the Phase 3 hook):** `CommissionService.resolveRateBps` now subtracts `GamificationService.commissionReductionBps(driver)` — top-3 weekly drivers get `GAMIFICATION_TOP3_REDUCTION_BPS` (−100 bps) off, capped at `GAMIFICATION_MAX_REDUCTION_BPS` and floored at `COMMISSION_MIN_RATE_BPS` (10%). Verified: a leaderboard-leading driver's next ride is settled at 19% instead of 20%.
- **Referrals** (`ReferralsModule`): each `User` gets a unique lazily-generated `referralCode`; `POST /referrals/apply` records `referredByUserId` (one-time, no self-referral). On the referee's first completed ride both sides are credited `REFERRAL_REWARD` (default ₦500) via a REVENUE-funded `REFERRAL` ledger transaction — idempotent via the `referralRewarded` flag + a per-referee reference.
- **Subscriptions** (`SubscriptionsModule`): static plan catalog (Weekly Lite / Monthly Commute / Monthly Unlimited). Subscribe charges the plan fee from the wallet (`SUBSCRIPTION` ledger txn, rolled back if the charge fails) and creates an ACTIVE `Subscription`. **Same-driver:** the first driver to serve an active subscriber is captured as `assignedDriverId`; `MatchingService.findCandidates` then dispatches *exclusively* to that driver when they're online + eligible.
- **Ride hooks:** `rides.complete()` fires gamification + referral rewards (best-effort, never blocks completion); `rides.request()` routes subscribers to their sticky driver; `accept`/`acceptOffer` capture it.
- **Enums added:** `TransactionType.SUBSCRIPTION` + `REFERRAL`, `AchievementBadge`.
- **Deferred:** subscription auto-renew billing (BullMQ cron) + metered per-ride coverage/discount; streak-based commission bonuses; mobile engagement UI.

---

*Architecture draft v1; updated as decisions land (latest: Phase 4 Engagement, 2026-06-04).*
