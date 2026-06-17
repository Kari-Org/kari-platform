# Debug Guide

Patterns for diagnosing and fixing issues in KariPlatform. This file replaces the greenfield "build-plan" from the reference system — since the project is halfway built, the priority is efficient debugging, not build sequencing.

---

## Before Debugging Anything

1. Check `progress-tracker.md` — is this feature actually implemented yet?
2. Check the relevant `ARCHITECTURE.md` (backend/, rider/, driver/, admin/) for the intended design
3. Reproduce the issue — never fix what you can't reproduce

---

## Common Diagnosis Patterns

### Backend Not Starting
```bash
# Check if Postgres + Redis are running
brew services list | grep -E 'postgres|redis'
# OR
docker compose ps

# Check env
cat backend/.env | grep -E 'POSTGRES|REDIS'

# Check for port conflicts
lsof -i :3000

# Start with verbose logging
LOG_LEVEL=debug pnpm --filter @kari/backend run dev
```

### Mobile App Crashing
```bash
# Clear Metro cache
pnpm --filter @kari/rider exec expo start -c

# Check for NativeWind issues (most common crash source)
# Verify tailwind.config.js has the mobile-core content glob
# Verify nativewind@4.2.4 is pinned

# TypeORM/types mismatch after enum changes
pnpm --filter @kari/types run build  # MUST rebuild after editing types
```

### Socket Events Not Arriving
1. Backend: is the event emitted to the right room? The real model is `emitToUser(userId, …)` → `user:{userId}`. There are **no** `ride:{id}`/`driver:{id}` rooms (`'ops'` is the only non-user room, for panic).
2. Mobile: is the socket connected? Check `socket.connected` state
3. Mobile: is the listener registered before the event fires? (Race condition)
4. Redis adapter: is Redis running? Socket fan-out requires it.
5. JWT: is the socket auth token valid? Expired tokens fail silently.

### Ride State Machine Issues
The ride state machine is the most complex flow. Valid transitions:
```
SEARCHING -> OFFERED -> ACCEPTED -> DRIVER_ARRIVED -> IN_PROGRESS -> COMPLETED
         \-> CANCELLED (from any state)
         \-> NEGOTIATING -> ACCEPTED (for NEGOTIATE priceType)
```
- `@VersionColumn` prevents concurrent mutations — check for OptimisticLockVersionMismatchError (409)
- One active ride per rider — `POST /rides` returns 409 if another is in progress
- Start OTP (`startOtp`) is shown to rider only — driver must enter it to start the ride

### Payment / Money Issues
- All amounts in **kobo** (1 naira = 100 kobo)
- Every balance change must post balanced ledger entries (debit + credit)
- Check wallet balance: `SELECT balance FROM wallets WHERE "ownerId" = '...'`
- Check ledger: `SELECT * FROM ledger_entries WHERE "walletId" = '...' ORDER BY "postedAt" DESC`
- Idempotency: duplicate payment requests should be no-ops, not double-charges

### Admin Auth Issues
- JWT stored in httpOnly cookie — not visible in browser JS
- All API calls go through `/api/proxy/[...path]` — check the proxy is injecting the Bearer
- `middleware.ts` gates routes — check the matcher pattern
- RBAC: permissions come from `@kari/types/rbac.ts` `ROLE_PERMISSIONS` map

### Notifications Not Delivering
- One real BullMQ queue: **`notifications`** (worker = `notifications.processor.ts`); jobs are `deliver` (fan-out) and `sms` (raw, for non-users like emergency contacts).
- The in-app `notification` row is persisted **synchronously**; push/SMS/email go through the queued `deliver` job. A missing in-app row ≠ a missing delivery — check both.
- Is Redis up and the processor running? BullMQ needs Redis; no worker = jobs pile up.
- Push/Email/SMS providers are **noop by default** → they just log to console. "Not delivered" in dev usually means noop, not a bug.

### Ride Variants (Carpool / Shuttle / Subscription)
> As-built — these diverge from the target Ride Flows (see project-overview.md → Ride Flows; the gaps are in this file's tracker counterpart).
- **Carpool:** NIN-gated — create *and* join require `ninStatus = VERIFIED` (else 403). Seat claims are `@VersionColumn` (409 on concurrent last seat). Fare is currently **equal-split**, recomputed on join/leave.
- **Shuttle:** routes/stops/trips are **seeded on boot** (idempotent) — empty shuttle UI usually means the seeder didn't run. Trips use `@VersionColumn` seat inventory; bookings charge wallet → REVENUE.
- **Subscription:** static plan catalog; `assignedDriverId` is captured from the first serving driver; matching then dispatches **exclusively** to that sticky driver while they're online.

### Admin Data Pages (A2–A6)
- All admin data is `GET /admin/*` via the proxy: `stats`, `fleet`, `rides`, `users`, `drivers`, `finance/summary`, `finance/payouts`, `fare-config`, `tickets`, `audit`.
- Empty page → check the proxy injected the Bearer **and** the admin's role has the gating permission (`ROLE_PERMISSIONS`).
- **Audit log empty?** The `AuditInterceptor` records only **non-GET** `/admin/*` requests by design — GETs aren't audited.
- **Live fleet stale?** It hydrates from `GET /admin/fleet` (Redis GEO + active rides) then applies `admin:fleet` socket deltas — check Redis is up and the socket connected.

---

## Database Quick Queries

```sql
-- Find a user by phone
SELECT id, role, email, phone, status FROM users WHERE phone = '+234...';

-- Check driver onboarding state
SELECT u.phone, dp."onboardingComplete", dp."kycStatus", dp.personality
FROM driver_profiles dp JOIN users u ON dp."userId" = u.id
WHERE u.phone = '+234...';

-- Active rides for a user
SELECT id, status, "priceType", "quotedPrice", "agreedPrice", "startOtp"
FROM rides WHERE "riderId" = '...' AND status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY "createdAt" DESC;

-- Wallet balance + recent ledger
SELECT w.id, w.balance, w."walletOwnerType"
FROM wallets w WHERE w."ownerId" = '...';

SELECT le.direction, le.amount, le.reference, le."postedAt"
FROM ledger_entries le WHERE le."walletId" = '...'
ORDER BY le."postedAt" DESC LIMIT 10;

-- Online drivers (check Redis, not Postgres)
-- Use: redis-cli GEORADIUS drivers:geo <lng> <lat> 5000 m
```

---

## Testing Patterns

### Backend API Testing (curl)
```bash
# Login
curl -s localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"phone":"+2341234567890","password":"Pass123!"}' | jq

# Get auth token from response, then:
curl -s localhost:3000/riders/me -H "Authorization: Bearer $TOKEN" | jq

# OTP codes in dev: grep the backend log
grep "Your Kari code" /tmp/kari-backend.log | tail -5
```

### Driver Ride Simulation
```bash
# Use the E2E simulator (if available)
node /tmp/kari-p2-e2e.mjs

# Or manual dispatch test
node /tmp/kari-dispatch.mjs [negotiate]
```

### Mobile Testing
- Expo Go works for P0-P1 (auth + onboarding) and P2 foreground flows
- Background location (driver) requires EAS dev build
- `env.ts` auto-derives API host from Metro `hostUri` — no manual IP edits needed
- Noop providers log OTPs to backend console — no real SMS needed

---

## pnpm Monorepo Gotchas

These have all cost real debugging time:

1. **Dependency build-script approvals** live in `pnpm-workspace.yaml` under `allowBuilds:` — NOT in package.json `pnpm` field
2. **`node-linker`** is ignored in `.npmrc` — must set `nodeLinker: hoisted` in `pnpm-workspace.yaml` (Expo/NativeWind requirement)
3. **After editing `@kari/types`:** `pnpm --filter @kari/types run build` — backend and mobile consume built `dist/`, not source
4. **`sharp` pinned false** in `pnpm-workspace.yaml` `allowBuilds` (admin image optimization)
5. **Admin `next build`/`next dev`:** never run simultaneously — shared `.next` directory
6. **Run admin build from `admin/` cwd:** Tailwind PostCSS detects config from `process.cwd()` — from repo root it misses the theme
7. **pnpm interactive dep-check hangs** in detached shells — bypass with `CI=1` or call `node_modules/.bin/next` directly
8. **NativeWind version:** pinned to `4.2.4` (works with SDK 54 + Reanimated 4). Older `4.1.23` was for SDK 52.

---

## Issue Triage Order

When something breaks:

1. **Is the backend running?** Check Postgres, Redis, port 3000
2. **Is it a type mismatch?** Rebuild `@kari/types` after enum changes
3. **Is it a NativeWind/Metro issue?** Clear cache, verify config
4. **Is it a socket race condition?** Add logging to listener registration
5. **Is it an auth issue?** Check token expiry, refresh flow, cookie state
6. **Is it a state machine violation?** Check the valid transitions diagram above
7. **Is it a money math error?** Verify kobo units, check ledger balance invariant
