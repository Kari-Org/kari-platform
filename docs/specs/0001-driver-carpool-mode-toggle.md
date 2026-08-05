# 0001. Driver carpool mode toggle

**Date**: 2026-08-03
**Status**: Accepted

## Summary

Freelance drivers get an "accept carpool requests" switch (carpool mode). Carpool dispatch will only
offer trips to freelance drivers who are online with the switch on. Today carpool offers go to every
nearby online driver, including dedicated drivers, which breaks the platform's eligibility rule. This
slice adds one column, one endpoint, a dispatch filter, and a switch in the driver app. It is the
prerequisite for the later carpool work (per rider PIN and en route dispatch).

## Context

The ride type matrix (`context/architecture.md`) says carpool trips are served by freelance drivers who
opted in, and `context/foundation.md` §5 names matching eligibility as the load bearing rule. The code
does not enforce this today: `MatchingService.findCandidates` filters by availability, car category,
onboarding, and personality only. It never checks `driverType` or any carpool opt in, because no opt in
exists. `CarpoolsService.create` reuses that same candidate search, so a dedicated driver (or a
freelance driver who never wanted shared trips) can receive a `carpool:offer` socket event today.

Two forces shape the fix. First, `findCandidates` has two callers (solo rides in `rides.service.ts`
line 192 and carpools in `carpools.service.ts` line 114), so the filter must be added without changing
solo behavior. Second, the driver app already has a clean availability surface (the online/offline
switch on the home tab backed by `availability.store.ts` and `/availability/*` endpoints), so the new
switch belongs beside it.

Not deciding leaves carpool v1 dispatching to ineligible drivers, and blocks the carpool v2 slices that
build on the opt in pool.

## Requirements

**User stories**:

- As a freelance driver, I want to opt in or out of carpool requests so that shared trips only come to me when I want them.
- As a rider creating a carpool, I want my request to reach only drivers who accept carpools so that offers are not wasted on drivers who will ignore them.

**Acceptance criteria**:

- **AC-1**: A freelance driver can turn carpool mode on or off from the driver app, and the setting persists on the server across app restarts and sessions.
- **AC-2**: Carpool dispatch only targets drivers who are online, freelance, onboarding complete, and have carpool mode on. Dedicated drivers and freelance drivers with the switch off never receive `carpool:offer`.
- **AC-3**: Solo ride dispatch is unchanged. Carpool mode on does not remove a driver from solo dispatch, and the `findCandidates` change does not alter either existing call site's behavior for solo rides.
- **AC-4**: A dedicated driver calling the carpool mode endpoint gets a 403 with a clear message.
- **AC-5**: `GET /drivers/me` returns `carpoolMode`.
- **AC-6**: Toggling while offline is allowed and persists; it simply has no dispatch effect until the driver goes online.
- **AC-7**: The driver app hides the carpool switch for dedicated drivers.
- **AC-8**: The app hydrates the switch from `/drivers/me` on launch (the switch never guesses).

## Options considered

### Option 1: Persist carpool mode on `driver_profiles` (a boolean column), filter in `findCandidates` via an options argument

One nullable free boolean column with a default of false, a small `POST /availability/carpool-mode`
endpoint beside the existing availability routes, and an optional filter options parameter on
`findCandidates` that only the carpool call site passes.

**Pros**:

- The setting lives with the profile the matcher already loads (`findByUserIds`), so the filter costs no extra query.
- Optional options argument leaves the solo call site untouched (AC-3 by construction).
- Matches the existing pattern: availability state changes are POST routes under `/availability`.

**Cons**:

- One more column on an already wide `driver_profiles` entity.

### Option 2: Keep carpool mode in Redis (a set of opted in driver ids) beside the GEO set

**Pros**:

- No schema change; toggles are one Redis op.

**Cons**:

- The setting is durable state, not ephemeral presence. Redis loss would silently reset every driver's preference (violates AC-1's persistence).
- Splits driver state across two stores; `/drivers/me` hydration (AC-5) would need a second lookup.

### Option 3: A separate `driver_settings` entity for this and future preferences

**Pros**:

- Room for future preference sprawl without widening the profile.

**Cons**:

- A new table, join, and module surface for one boolean today (speculative abstraction; `context/code-standards.md` calls this a smell).

### Option 4: Filter at the carpool call site instead of inside the matcher

Leave `findCandidates` untouched; in `CarpoolsService.create`, re fetch the returned candidates'
profiles and drop non freelance or opted out drivers there.

**Pros**:

- Solo regression risk becomes structurally impossible (the shared matcher never changes).

**Cons**:

- Duplicates a profile fetch the matcher already did and throws away, and splits eligibility logic across two files; the next variant slice (shuttle, subscription) would copy the same post filter again.

## Decision

**Chosen option**: Option 1: profile column plus an options argument on the matcher.

Add `carpoolMode` to `DriverProfile`, expose `POST /availability/carpool-mode`, filter carpool dispatch
through a new optional `opts` parameter on `findCandidates` (`requireCarpoolMode` and `driverType`),
and surface the switch on the driver home tab beside the online switch.

## Rationale

The profile column wins because the matcher already loads full profiles for candidate filtering, so the
new checks are free at dispatch time, and durable preference state belongs in Postgres, not Redis
(`context/foundation.md` §7 #11 treats Redis as ephemeral). The options argument shape is chosen over a
new dedicated method (`findCarpoolCandidates`) because the two share every other filter and would drift
apart as duplicate code. Solo behavior stays identical because the parameter defaults to the current
behavior. A 403 for dedicated drivers (rather than silently ignoring) keeps the API honest and testable.

## Feature design

**Data model sketch**:

- `driver_profiles`: add `carpoolMode boolean NOT NULL DEFAULT false`. No other entity changes. Dev applies it via `DB_SYNCHRONIZE`; production ships it as a TypeORM migration per `context/architecture.md` invariants.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /availability/carpool-mode | POST | `enabled: boolean` (req) | `{ carpoolMode: boolean }` | bearer, DRIVER role | 403 dedicated driver |
| /drivers/me | GET | (existing) | now includes `carpoolMode` | bearer, DRIVER role | (existing) |

**Matcher change** (internal contract, not HTTP):
`findCandidates(lat, lng, category, preference, preferredDriverId?, radius?, limit?, opts?)` where
`opts = { requireCarpoolMode?: boolean; driverType?: DriverType }`. Both default to undefined, meaning
no new filtering. `CarpoolsService.create` passes `{ requireCarpoolMode: true, driverType: DriverType.FREELANCE }`.

**Search window guard**: `GEOSEARCH` currently over fetches a fixed `limit * 3` window before
filtering. The new filters are selective (few drivers will have carpool mode on at first), so a fixed
window can return zero eligible drivers while eligible ones sit just outside it. When `opts` adds
filters, widen the over fetch multiplier (use `limit * 6` for carpool dispatch) so the shrunken pool
still fills.

**Key invariants**:

- Carpool dispatch never emits `carpool:offer` to a driver whose profile fails any of: online, freelance, onboarding complete, carpool mode on.
- Solo dispatch behavior is byte for byte the same when `opts` is absent.
- `carpoolMode` defaults to false; a driver never opts in implicitly.
- Accepted race: a driver who toggles off between the candidate search and the offer emission may receive one stale `carpool:offer`; they simply ignore it. No locking is added for this.

**Security model**:

- Endpoint gated by the existing `RolesGuard` with `UserRole.DRIVER`.
- Service layer rejects dedicated drivers with 403 (the guard cannot see driver type; the service loads the profile anyway).
- No new PII. The flag is not sensitive.

**Critical test scenarios**:

- Happy path: freelance driver toggles on, goes online, a carpool is created nearby, driver receives `carpool:offer`; toggles off, next carpool skips them, verifies **AC-1**, **AC-2**.
- Eligibility: dedicated driver online nearby never receives `carpool:offer`; POST carpool-mode as dedicated returns 403, verifies **AC-2**, **AC-4**.
- Regression: solo ride dispatch to a driver with carpool mode off (and on) behaves exactly as before, verifies **AC-3**.
- Hydration: relaunch the app after toggling; switch reflects the server value, verifies **AC-5**.
- Offline toggle: toggle while offline, go online, carpool dispatch includes the driver, verifies **AC-6**.

## Build plan

Tracer bullet order (thin end to end thread first, per the project default; no approach was recorded, assumption noted):

1. [x] `@kari/types` needs no new enum; confirmed no shared driver profile contract exists in `packages/types` (the app's type is local), so no types change, satisfies **AC-5**. (2026-08-03)
2. [x] Backend: `carpoolMode` column on `DriverProfile`; `DriverService.setCarpoolMode` (403 for dedicated); `POST /availability/carpool-mode` + `CarpoolModeDto`, satisfies **AC-1**, **AC-4**, **AC-6**. (2026-08-03)
3. [x] Backend: optional `opts` filter on `MatchingService.findCandidates` with the widened window (`limit * 6`) when filters are active; carpool dispatch passes `{ requireCarpoolMode: true, driverType: FREELANCE }`; `rides.service.ts` untouched, satisfies **AC-2**, **AC-3**. (2026-08-03)
4. [x] Driver app: `carpoolMode` on the local `DriverProfile` type, `availabilityApi.carpoolMode`, home tab switch (freelance only, optimistic flip with rollback, hydrated from `/drivers/me`), satisfies **AC-1**, **AC-7**, **AC-8**. (2026-08-03)
5. [x] Verified against the running backend (2026-08-03): AC-1 through AC-6 proven at runtime (real signup/OTP users, live Postgres/Redis, dispatch counts observed: opted out freelance skipped, dedicated excluded even with mode on, solo unchanged at dispatchedTo=2, 403 for dedicated, offline toggle persists). AC-7/AC-8 are code verified (typecheck green, switch gated on driverType, hydrated from the driver-me query); device pass pending per repo convention.

## Consequences

**Positive**:

- The eligibility rule in the ride type matrix is enforced in code for carpools, not just documented.
- Unblocks carpool v2 (per rider PIN, incremental dispatch), which depends on a real opt in pool.

**Negative / tradeoffs**:

- `driver_profiles` widens by one column; the entity is already large.
- Carpool candidate pools shrink until drivers discover the switch (offers may reach fewer drivers at first; this is the correct product behavior, but adoption needs the UI to be visible).

**Neutral**:

- Production rollout needs the column migration before the code deploy (column has a default, so it is a safe additive migration).
- `findCandidates` gains a parameter; future ride variant slices (shuttle, subscription) can reuse `opts.driverType` instead of adding new methods.

## Follow-up

- [ ] Founder call: should carpool mode default to ON for new freelance drivers after KYC (bigger pool) or stay opt in (chosen here, opt in, the conservative default)? Revisit with real driver adoption data.
- [ ] Solo dispatch also never filters by `driverType`; dedicated drivers currently sit in the solo pool too. Same `opts` mechanism can fix it in a later slice (out of scope here, noted in `context/build-graph.md` territory).
