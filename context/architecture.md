# Architecture

## Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Language | TypeScript (strict) | Everything end-to-end |
| Package manager | pnpm 11 | Workspaces, hoisted for Expo |
| Monorepo | Turborepo | Task orchestration |
| Backend framework | NestJS 11 (Node 24) | Unified API + WebSocket server |
| Database | PostgreSQL 16 + TypeORM | Durable state, migrations |
| Cache / Ephemeral | Redis 7 | Live driver geo, quotes, socket adapter, BullMQ |
| Realtime | Socket.IO 4 + Redis adapter | Per-user rooms (`user:{id}`), JWT-authed |
| Jobs / Async | BullMQ 5 | OTP expiry, notifications, commission, leaderboards |
| Auth | Self-issued JWT (access + rotating refresh), scrypt password hash | Stateless, no Cognito; scrypt = no native dep |
| Mobile framework | Expo SDK 54, React Native 0.81, React 19 | Rider + Driver apps |
| Mobile routing | Expo Router v6 (file-based) | Screen navigation |
| Mobile state | Zustand + TanStack Query | Client state + server state |
| Mobile styling | NativeWind 4 + Tailwind CSS | Token-driven design |
| Admin framework | Next.js 15, App Router | Operations dashboard |
| Admin auth | Email/password -> backend JWT (httpOnly cookie, same-origin proxy) | Custom, not NextAuth |
| Admin styling | Tailwind 3 + shadcn/ui | Dark theme |
| Payments | Paystack (primary, behind interface) | Flutterwave alternative |
| KYC / Identity | Dojah (NIN) + AWS Rekognition (liveness) | |
| Maps | Google Maps API | Distance Matrix, autocomplete |
| SMS | Termii (Nigeria-optimized) | OTP |
| WhatsApp | Twilio | OTP alternative channel |
| Voice (masked) | Twilio | In-ride calls |
| Storage | AWS S3 | Driver/rider documents |
| Push | Expo Push / FCM | Decision pending (Phase 7) |
| Logging | pino (structured) | Per-request traceId |
| Validation | class-validator + Zod | DTOs + env config |
| Rate limiting | @nestjs/throttler | Auth/OTP abuse protection |
| Testing | Jest + Supertest (backend), Maestro (mobile e2e, planned) | |

---

## Monorepo Structure

```
KariPlatform/
├── backend/                  # NestJS unified backend
│   └── src/
│       ├── app.module.ts     # ~25 modules imported; global guards/filters
│       ├── main.ts           # Bootstrap (helmet, CORS, validation, Socket.IO, Swagger)
│       ├── auth/             # JWT auth, signup/login, OTP, Google OAuth, refresh
│       ├── identity/         # NIN verification, liveness
│       ├── driver/           # Driver profiles, onboarding, KYC, availability
│       ├── rider/            # Rider profiles, onboarding, preferences
│       ├── rides/            # Ride lifecycle + state machine, offers, negotiation, ratings;
│       │                     #   matching.service (Redis GEO), pricing.service (tiered+traffic),
│       │                     #   availability.controller — all live HERE (no separate dirs)
│       ├── money/            # wallet + ledger (double-entry) + payments (Paystack) +
│       │                     #   commission — ONE module, not four dirs
│       ├── gamification/     # Scores, badges, leaderboard, commission reductions
│       ├── referrals/        # One-time reward on first completed ride
│       ├── subscriptions/    # Static plans, sticky driver assignment
│       ├── carpools/         # NIN-gated, cost-split, optimistic locking
│       ├── shuttle/          # Fixed routes (Lekki/Aba), stops, seat inventory
│       ├── notifications/    # BullMQ queue, push/SMS/email/in-app fan-out
│       ├── safety/           # Panic, emergency contacts, share-trip
│       ├── comms/            # In-ride chat (socket), masked calls (Twilio)
│       ├── admin/            # Audit logging, admin endpoints
│       ├── places/           # Google Places autocomplete, reverse geocode
│       ├── users/            # User entity, shared user operations
│       ├── tickets/          # Support tickets (app/web/email)
│       ├── providers/        # contracts.ts (10 interfaces) + paystack + noop impls
│       ├── config/           # Zod-validated env config
│       ├── database/         # TypeORM data source, seed scripts
│       ├── redis/            # Redis module
│       ├── queue/            # BullMQ module
│       ├── realtime/         # Socket.IO gateway + RealtimeService (user:{id} rooms only)
│       └── common/           # Guards, filters, interceptors, decorators
├── rider/                    # Expo/RN rider app
│   ├── app/                  # File-based routing (Expo Router)
│   │   ├── (auth)/           # welcome, signup, signin, verify-method, otp, forgot-password
│   │   ├── (onboarding)/     # profile, preferences, liveness
│   │   ├── (tabs)/           # home, rides, account
│   │   ├── book.tsx · ride/[id].tsx · ride-history.tsx   # Book, active ride, history
│   │   ├── carpools.tsx · carpool/[id].tsx · shuttle.tsx · subscriptions.tsx  # Variants (P5)
│   │   ├── wallet.tsx · rewards.tsx           # Wallet/payments (P3), gamification (P4)
│   │   ├── safety.tsx · chat/[rideId].tsx · notifications.tsx  # Safety + comms (P6)
│   │   └── verify-nin.tsx · support.tsx · success.tsx   # NIN gate, support ticket, success
│   └── src/
│       ├── api/              # Endpoint definitions, session management
│       ├── stores/           # Zustand: auth, location, ride, signup
│       ├── realtime/         # Ride-event socket hooks
│       ├── theme/            # App theme glue (tokens from @kari/mobile-core)
│       ├── components/       # App-specific components
│       └── lib/              # Utilities
├── driver/                   # Expo/RN driver app
│   ├── app/                  # File-based routing
│   │   ├── (auth)/           # welcome, signup, signin, verify-method, otp
│   │   ├── (onboarding)/     # index.tsx — 6-step KYC wizard (single screen)
│   │   ├── (tabs)/           # home (map + online toggle), trips, account
│   │   ├── ride.tsx          # Active ride: dispatch -> complete (single screen)
│   │   ├── earnings.tsx · rewards.tsx          # Earnings/wallet (P3), gamification (P4)
│   │   ├── carpool.tsx · shuttle.tsx           # Carpool + shuttle driver flows (P5)
│   │   └── safety.tsx · chat/[rideId].tsx · notifications.tsx · support.tsx  # Safety/comms (P6)
│   └── src/
│       ├── api/              # Endpoint definitions
│       ├── stores/           # Zustand: auth, availability, carpool, ride, signup
│       ├── realtime/         # useDriverDispatch socket hook
│       ├── location/         # Foreground + background location tracker
│       ├── components/       # App-specific (IncomingRequest, SwipeToAccept)
│       └── lib/              # Utilities
├── admin/                    # Next.js admin dashboard
│   ├── app/
│   │   ├── (auth)/login/     # Login page
│   │   ├── (dash)/           # dashboard, live, trips, users, dedicated-drivers, tickets,
│   │   │                     #   audit, settings, revenue, payouts, promotions, fare-config,
│   │   │                     #   admins (ComingSoon stub)
│   │   └── api/              # admin/login + admin/logout (set/clear cookie);
│   │                         #   proxy/[...path] (injects Bearer from httpOnly cookie)
│   ├── components/           # ui/ (shadcn), shell/ (Sidebar, Topbar), can.tsx, session-provider
│   ├── lib/                  # api, admin-api, auth, nav, rbac, socket, query, env, constants
│   └── middleware.ts         # Route gating
├── packages/
│   ├── types/                # @kari/types — enums, API contracts, RBAC
│   │   └── src/
│   │       ├── enums.ts      # 60+ enums (UserRole, RideStatus, TransactionType, etc.)
│   │       ├── rbac.ts       # AdminRole, PERMISSIONS, ROLE_PERMISSIONS, hasPermission()
│   │       └── api.ts        # ApiResponse<T>, ApiError, Paginated<T>, GeoPoint
│   └── mobile-core/          # @kari/mobile-core — shared mobile foundation
│       └── src/
│           ├── api/          # Typed fetch wrapper (apiFetch, configureApi)
│           ├── realtime/     # Socket singleton
│           ├── theme/        # Design tokens (colors, fonts) + Tailwind preset
│           ├── components/   # 10 UI primitives (Screen, KariButton, InputField, etc.)
│           └── index.ts      # Barrel export
├── web/                      # @kari/web — Next.js 15 marketing site (8 sections, light theme; see web/context/)
├── brand/                    # Logo, icons, fonts, design assets
├── docker-compose.yml        # Local Postgres + Redis
├── turbo.json                # Turborepo task config
├── pnpm-workspace.yaml       # Workspace definitions + pnpm config
└── tsconfig.base.json        # Shared TypeScript config
```

---

> **Per-product context:** each product has its own `context/` folder with deeper, code-verified detail —
> `backend/context/` · `rider/context/` · `driver/context/` · `admin/context/` · `web/context/` (catalogs,
> registries, and — for backend/rider/driver/admin — a reconciled ARCHITECTURE.md).

---

## System Boundaries

| Location | Owns | Never Does |
|----------|------|------------|
| `backend/src/{module}/` | Domain logic, entities, DTOs, services | Import from rider/driver/admin |
| `backend/src/providers/` | Third-party integrations behind interfaces | Hardcode vendor-specific logic in modules |
| `rider/app/` | Screens and navigation | Business logic, direct API calls |
| `rider/src/stores/` | Client state (Zustand) | DB calls, server logic |
| `rider/src/api/` | API call definitions | UI rendering |
| `driver/app/` | Screens and navigation | Business logic |
| `driver/src/stores/` | Client state | DB calls |
| `admin/app/` | Pages and API proxy | Business logic |
| `packages/types/` | Shared enums, contracts, RBAC | Runtime logic, React components |
| `packages/mobile-core/` | Shared mobile UI + API client + socket | App-specific screens, stores, endpoints |

---

## Data Flow Patterns

### Mobile -> Backend (API call)
```
Screen triggers action
    -> Zustand store or direct call
    -> apiFetch() from @kari/mobile-core (typed, handles Bearer + refresh)
    -> Backend API route (guard + validation + service)
    -> TypeORM DB write or Redis operation
    -> ApiResponse<T> envelope returned
```

### Real-time (Socket.IO)
```
Backend event (ride matched, driver arrived, etc.)
    -> RealtimeService.emitToUser(userId, event, payload)
    -> emits to that user's room: user:{userId}   # NOT ride:{id} or driver:{id}
    -> Mobile socket listener in store/hook
    -> Zustand state update
    -> UI re-renders
```
> Socket model is **per-user rooms only**. On connect, the gateway JWT-auths and joins the socket to
> `user:{id}`. Every ride/carpool/chat event is fanned out to each participant's `user:{id}` room via
> `emitToUser`. The only non-user room is `'ops'` (safety panic). There are **no** `ride:{id}` /
> `driver:{id}` rooms despite what older docs (incl. backend ARCHITECTURE.md) imply.

### Admin -> Backend
```
Admin page fetches data
    -> fetch('/api/proxy/admin/...') (same-origin)
    -> Next.js proxy route injects Bearer from httpOnly cookie
    -> Backend /admin/* endpoint (PermissionsGuard)
    -> Response
```

---

## Database Entity Groups

> Table names are **snake_case plural** (`rider_profiles`, `ledger_entries`); **column** names are
> camelCase (`riderId`, `walletOwnerType`) — quote them in SQL. 29 entities total.

### Users & Profiles
- `users` (User) — id, role (DRIVER/RIDER/ADMIN), email, phone, passwordHash, status, adminRole, referralCode
- `driver_profiles` (DriverProfile) — userId, driverType, personality, onboardingComplete, DOB, NIN/KYC status, spotifyInstalled, rating
- `rider_profiles` (RiderProfile) — userId, preferences (gender, music, accessibility), cardToken, NIN status, rating
- `vehicles` (Vehicle) — driverId, model, plate, photos
- `saved_addresses` (SavedAddress) — riderId, label (home/work), geo

### Rides & Matching
- `rides` (Ride) — type, status (state machine), pickup/dropoff (geo), riderId, driverId, quotedPrice, agreedPrice, paymentMethod, startOtp, @VersionColumn
- `ride_offers` (RideOffer) — driverId, rideId, amount, status
- `ratings` (Rating) — mutual driver<->rider

### Money
- `wallets` (Wallet) — ownerId, balance (kobo), walletOwnerType (USER/SYSTEM: REVENUE, GATEWAY)
- `ledger_entries` (LedgerEntry) — walletId, direction (CREDIT/DEBIT), amount, transactionId
- `transactions` (Transaction) — type, status, reference (idempotency), gatewayRef (Paystack)

### Engagement
- `driver_scores` (DriverScore) — points per ride, ISO-week + ALL all-time buckets
- `achievements` (Achievement) — badges (FIRST_RIDE, TEN_RIDES, etc.)
- `subscriptions` (Subscription) — plan, route, assignedDriverId (sticky)

### Ride Variants
- `carpools` (Carpool) — @VersionColumn seat guard, NIN-gated, cost-split + `carpool_members` (CarpoolMember)
- `shuttle_routes` / `shuttle_stops` / `shuttle_trips` (@VersionColumn) / `shuttle_bookings`

### Safety & Comms
- `emergency_contacts`, `panic_events`, `shared_trips` (opaque token, 12h TTL)
- `chat_messages`, `notifications`, `device_tokens`

### Admin & Identity
- `audit_logs` (AuditLog) — every admin write (actor, before/after JSON)
- `support_tickets` (SupportTicket) — support inbox (source: APP/WEB/EMAIL)
- `documents` (Document) — uploaded driver/rider files (S3 URL + status)

---

## Ride Type Matrix

The contract governing matching, state machine, and settlement per ride type. Narrative flows live in
[project-overview.md](project-overview.md) → Ride Flows; gaps in [progress-tracker.md](progress-tracker.md).

| Type | Driver eligibility | Pricing | Payment | Start PIN | Status vs vision |
|------|--------------------|---------|---------|-----------|------------------|
| **Solo** | Freelance only (for now) | Standard (3 tiers) **or** Negotiate (tier-agnostic, no floor) | Wallet / card / cash | 1 PIN, minted on accept | Built; PIN-on-accept ✓ |
| **Carpool** | Freelance, opt-in carpool mode | Standard only; **discounted ride-share** (not equal split) | Wallet → saved-card fallback | **1 PIN per rider** | GAP: equal-split today; no carpool-mode toggle, en-route incremental dispatch, per-rider PIN, or route optimization |
| **Shuttle** | Dedicated; ops assigns bus+route via admin | Fixed, stop-distance based | **Wallet only** | n/a — **QR scan** board/alight | GAP: pre-book-a-seat today; QR boarding + ops bus/route assignment not built |
| **Subscription** | Sticky dedicated → dedicated → freelance fallback | **Prepaid monthly, per-route price**; free at point of use | Monthly charge (rides free at use) | per underlying ride | GAP: static plan catalog today; no scheduler job, fallback chain, per-route pricing, or free-at-use |

**Matching eligibility** is the load-bearing rule: the matching path must filter candidate drivers by
`driverType` **and** ride type (Solo→freelance, Carpool→freelance in carpool mode, Shuttle→assigned
dedicated, Subscription→sticky-then-fallback). Carpool and Subscription dispatch are multi-step, not the
single-offer Solo path.

---

## Provider Abstraction

Every external service is behind an interface. Swap vendors by changing config, not code.

All 10 interfaces live in `backend/src/providers/contracts.ts`; impls + noops in the same folder.

| Interface | Primary | Alternative | Test/Dev (noop) |
|-----------|---------|-------------|----------|
| PaymentProvider | Paystack (real impl present) | Flutterwave (planned, not built) | NoopPaymentProvider (auto-succeeds) |
| IdentityProvider | Dojah (NIN) | — | NoopIdentityProvider (verified:true) |
| LivenessProvider | AWS Rekognition | — | NoopLivenessProvider (auto-pass) |
| StorageProvider | AWS S3 | — | NoopStorageProvider (mock URLs) |
| MapsProvider | Google Maps | — | NoopMapsProvider (OSM Nominatim, Nigeria-only) |
| SmsProvider | Termii | — | NoopSmsProvider (logs OTP to console) |
| WhatsAppProvider | Twilio | — | NoopWhatsAppProvider (logs OTP) |
| VoiceProvider | Twilio Voice | — | NoopVoiceProvider |
| EmailProvider | AWS SES (planned) | — | NoopEmailProvider (logs to console) |
| PushProvider | Expo Push / FCM (planned) | — | NoopPushProvider (logs to console) |

> Only **Paystack** has a real implementation today; every other provider runs on its noop. The full stack
> runs keyless — see [provider-docs.md](provider-docs.md).

---

## Authentication

- Self-issued JWT (access 15m + rotating refresh 30d) — TTLs confirmed in `config/env.schema.ts`
- Password: **scrypt** (Node built-in, stored `salt:hash` hex, constant-time compare) — **not Argon2id**, despite what backend/ARCHITECTURE.md and code-standards say. There is no `argon2` dependency; the impl deliberately avoids a native build.
- OTP: 4-digit (`randomInt(1000, 10000)`), 5-min expiry, via SMS (Termii) or WhatsApp (Twilio), channel configurable per request
- Google OAuth: `google-auth-library`, verify ID token, dev fallback (decode without verify when `GOOGLE_OAUTH_CLIENT_IDS` unset)
- Admin: email/password -> backend JWT in httpOnly cookie, same-origin proxy. **Custom implementation** (`admin/lib/auth.ts` + `app/api/admin/login`), **not** NextAuth/Auth.js — the admin ARCHITECTURE.md's "Auth.js" claim is aspirational; the code uses a plain cookie + `/auth/me` validation. Zoho SSO is not wired.

---

## Invariants

Rules that must never be violated:

- All money operations use kobo (minor units). Display naira to users.
- Every wallet balance change posts balanced debit/credit ledger entries.
- Rides use @VersionColumn — first concurrent actor wins, others get 409.
- One active ride per rider enforced at the API level.
- Driver must complete KYC before going online.
- NIN required for carpool participation.
- Provider implementations behind interfaces — modules never import vendor SDKs directly.
- Every backend module has its own entities, DTOs, services — no cross-module entity imports.
- Socket events are targeted to **per-user rooms (`user:{userId}`)** via `emitToUser` — never global broadcast. (No `ride:{id}`/`driver:{id}` rooms; `'ops'` room is the only exception, for panic.)
- `DB_SYNCHRONIZE=true` in dev only. Production uses migrations.
- After editing `@kari/types`, rebuild (`pnpm --filter @kari/types run build`) before backend/mobile typecheck.
- Never run `next build` while `next dev` is running for admin (shared `.next` directory).
