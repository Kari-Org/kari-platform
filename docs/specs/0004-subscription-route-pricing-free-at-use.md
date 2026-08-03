# 0004. Subscription route pricing and free at use

**Date**: 2026-08-03
**Status**: Accepted

## Summary

Subscriptions stop being a static plan catalog. A rider subscribes to their OWN route (home to work):
the monthly fee is computed from that route's solo fare, paid upfront from the wallet. While the
subscription is active, rides matching that route are free at the point of use: the rider pays
nothing, and the driver is paid their normal net out of the platform's already collected subscription
revenue. The rider app's subscription screens, which today run on a local placeholder store never
wired to the backend, are wired to the real API. The scheduler job, dedicated fallback chain, and
frequency or two way settings are later slices.

## Context

Subscriptions v1 (Phase 4) charges a static plan's fee from the wallet and captures a sticky driver,
but nothing meters rides: `ridesUsed` and `includedRides` exist on the entity and are never touched,
and a subscriber still pays full fare on every ride. The foundation's product story (§1, §8) is a
monthly fee priced per the rider's route with rides free at use.

Forces. First, the pieces already exist: quotes carry a route's solo fare (`pricing.service`), the
settlement seam is one call site (`rides.service.complete` → `payments.settleRide`), and the money
module posts balanced ledger legs with Σ(wallets) = 0 asserted. Second, the driver must still earn on
a "free" ride: subscription revenue was already collected into the platform REVENUE wallet at
subscribe time, so the driver's normal net can be paid FROM that wallet, keeping every leg balanced
and the driver whole (dedicated drivers are salaried eventually, but today's sticky driver can be
freelance, so skipping driver pay would break driver economics). Third, the graph exposed that the
rider app's subscription screens consume a local Zustand store with placeholder data, not the API, so
"display the price" is really "wire the surface at all."

Not deciding leaves the flagship subscription promise (§11: guaranteed prepaid commute) unbuilt while
the code carries dead metering fields and an unwired screen.

## Requirements

**User stories**:
- As a commuting rider, I want to subscribe to my own route for a monthly fee so that my daily trips are prepaid and predictable.
- As a subscribed rider, I want rides on my route to cost nothing at ride time so that the month is truly paid for.
- As a driver serving a subscriber, I want my normal earnings on those rides so that carrying subscribers never costs me.

**Acceptance criteria**:
- **AC-1**: `POST /subscriptions` accepts `{ quoteRef, label? }`; the monthly fee is computed from the quote's solo ECONOMY fare by the fixed formula (below), charged upfront from the wallet, and the subscription stores the route (pickup and dropoff coordinates and addresses) and the fee.
- **AC-2**: The fee formula is deterministic and observable: `monthlyFee = ceil((soloFare × 44 × 0.6) / 500) × 500` naira, where `soloFare` is the quote's fare with `category === ECONOMY` (named explicitly, never "the minimum"). Same quote, same fee.
- **AC-3**: Completing a ride whose pickup and dropoff both lie within 1 km of the active subscription's route endpoints (in either direction) charges the rider nothing: no rider wallet debit, `ridesUsed` incremented, the ride recorded with `paymentMethod = WALLET` regardless of what was requested (a covered ride must never read as CASH, or the driver could collect cash on top of the funded net), and the ride view exposes `coveredBySubscription: true` for both apps.
- **AC-4**: On a covered ride the driver receives the SAME net they would have earned uncovered — computed from the same `agreedPrice ?? quotedPrice` the completion path already resolves — paid from the platform REVENUE wallet; the sum of ALL wallet balances is 0 before and after (the global invariant, checked over every wallet, not just the touched legs).
- **AC-5**: A ride NOT matching the route (either endpoint beyond 1 km), or with no active subscription (expired, cancelled, none), settles exactly as today (rider pays; regression guarded).
- **AC-6**: An active subscription blocks a second one (409, unchanged), and `ridesUsed` is visible in `GET /subscriptions/mine`.
- **AC-7**: `rider/app/subscription-new.tsx` builds the subscription from a real quote (addresses in, fee preview from the server, subscribe calls the real API) and its trip type and weekday pickers are REMOVED (frequency/two way config is a later slice; nothing on the screen may suggest settings the backend ignores); `rider/app/subscriptions.tsx` lists real `mine()` data; the local placeholder store file is deleted and `grep useSubscriptions rider/` is clean.
- **AC-8**: A fee preview endpoint (`POST /subscriptions/preview` with `quoteRef`) returns the computed fee without subscribing, so the app never computes money client side (the spec 0003 rule).

## Options considered

### Option 1: Route on the subscription entity, coverage check at the settlement seam, driver paid from REVENUE

Subscribe from a quote; store route + fee on `subscriptions`; in `rides.service.complete`, check
coverage before calling `settleRide` and post a subscription coverage settlement instead when covered.

**Pros**:
- Reuses the quote infrastructure and the single settlement call site; no new module.
- Driver economics preserved with balanced legs (REVENUE → driver), no negative surprises.

**Cons**:
- Route matching by endpoint radius is coarse (a different destination 900 m away matches); acceptable at 1 km and tunable.

### Option 2: Keep the static catalog, add a route field for display only, meter with `includedRides`

**Pros**:
- Smallest diff.

**Cons**:
- The fee stays disconnected from the rider's actual route, which is the whole product promise; display only routes do not gate anything.

### Option 3: Credit model (subscription buys N ride credits, each ride burns one at face value)

**Pros**:
- Precise accounting per ride.

**Cons**:
- Requires a credits ledger concept the money module does not have, and the product story is "your route, unlimited commute," not a punch card. More machinery for a worse fit.

## Decision

**Chosen option**: Option 1: route priced subscription, coverage at the settlement seam, driver paid
from REVENUE.

## Rationale

Option 1 is the only shape that makes the fee mean something (it is derived from the rider's real
route via the existing quote), keeps the money invariants provable (all movements stay balanced ledger
posts; the REVENUE wallet that received the prepayment funds the driver's net), and touches exactly
one settlement call site, which the graph shows is the lone seam between rides and money. The 1 km
endpoint radius mirrors the carpool joinable radius convention (5 km there, tighter here because a
commute route is a fixed pair). The preview endpoint exists for the same reason spec 0003 added
`projectedShare`: clients never compute money.

## Feature design

**Data model sketch** (`subscriptions` table, additive nullable columns; dev via `DB_SYNCHRONIZE`,
production as an additive migration):
- `pickupLat/pickupLng/dropoffLat/dropoffLng: double NULL`, `pickupAddress/dropoffAddress: varchar NULL`
- `monthlyFeeNaira: int NULL`, `label: varchar(60) NULL`
- `planId` becomes nullable (route subscriptions carry no plan; old rows keep theirs).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /subscriptions/preview | POST | `quoteRef` (req) | `{ monthlyFeeNaira, soloFare, route }` | bearer RIDER | 400 expired quote |
| /subscriptions | POST | `quoteRef` (req), `label?` | subscription view (route, fee, period, ridesUsed) | bearer RIDER | 400 quote/fee/balance, 409 already active |
| /subscriptions/mine · /subscriptions/:id/cancel | existing | unchanged | view gains route, fee, ridesUsed | bearer RIDER | (existing) |

**Coverage check** (in `rides.service.complete`, before settlement): active sub AND sub has a route
AND `haversine(ride.pickup, sub.pickup) ≤ 1km AND haversine(ride.dropoff, sub.dropoff) ≤ 1km`, or the
same with endpoints swapped (two way commute). Haversine moves to a shared helper
(`backend/src/common/geo.ts`); the private copy in `carpools.service.ts` switches to it (one distance
function, not two subtly different ones).

On covered, settlement goes through the SAME `settleRide` in `payments.service`, extended with a
`source: 'rider' | 'subscription'` input (default `'rider'`): `'subscription'` swaps the debit wallet
from the rider's to REVENUE and skips the commission payout leg (commission stays in REVENUE), reusing
the existing fare/commission math, reference `ride_{id}`, and shape — one settlement path, not two that
drift. Fare basis: the same `agreedPrice ?? quotedPrice` completion already resolves. Metadata gains
`{ coveredBySubscription: subId }`; `ridesUsed` increments; ride fare fields set as usual with rider
charge 0 and `paymentMethod` forced to WALLET.

**Key invariants**:
- Rider wallet is never debited for a covered ride.
- Driver net on a covered ride equals driver net on the same ride uncovered (driver indifferent).
- Every coverage settlement posts balanced legs; Σ(all wallets) = 0 preserved.
- Fee formula lives in exactly one backend function; preview and subscribe share it.
- Coverage never applies to CARPOOL/SHUTTLE rides (SOLO and future SUBSCRIPTION type only).

**Security model**: unchanged (rider owns subscription; participant gated rides).

**Configuration required**: none (formula constants in code; founder tunes via follow up).

**Critical test scenarios**:
- Subscribe from a quote: fee = formula(soloFare), wallet debited, route stored, verifies **AC-1**, **AC-2**.
- Covered ride end to end: complete → rider balance unchanged, driver credited normal net from REVENUE, legs balance, ridesUsed 0→1, verifies **AC-3**, **AC-4**.
- Reversed direction (work → home) also covered, verifies **AC-3**.
- Far dropoff (> 1 km) → normal settlement (rider debited), verifies **AC-5**.
- Preview returns the same fee subscribe then charges, verifies **AC-8**.
- Rider app screens hit the real API (placeholder store deleted; grep for the store name is clean), verifies **AC-7**.

## Build plan

Tracer bullet order (project default assumption):

1. [x] Backend: entity columns (route, fee, label; planId nullable); `monthlyFeeFor` formula; `preview` + route aware `subscribeRoute` (quote read straight from Redis to avoid a RidesModule cycle); old plan subscribe removed; view gains route and fee, satisfies **AC-1**, **AC-2**, **AC-6**, **AC-8**. (2026-08-03)
2. [x] Backend: shared `common/geo.ts` haversine (carpools switched); `coverRide` coverage check (either direction, 1 km); `settleRide` `source: 'subscription'` (REVENUE funds driver net, commission stays, same math); `paymentMethod` forced WALLET; persisted `coveredBySubscription` flows into the ride view; SOLO only, satisfies **AC-3**, **AC-4**, **AC-5**. (2026-08-03)
3. [x] Rider app: `subscription-new.tsx` quote → preview → subscribe (trip type and weekday pickers removed); `subscriptions.tsx` + home tab card on real `mine()` data; placeholder store AND dead `lib/subscription.ts` deleted; `grep useSubscriptions rider/` clean, satisfies **AC-7**. (2026-08-03)
4. [x] Verified against the running backend (2026-08-03): real top up (noop gateway) → preview ₦59500 from solo ₦2250 (formula exact) → subscribe debits exactly the fee → 409 on second → covered reverse direction ride: rider balance unchanged, driver credited ₦1800 net funded by a REVENUE debit (ledger legs 180000/180000 kobo), CASH request overridden to WALLET, `coveredBySubscription: true`, ridesUsed 0→1 → far ride NOT covered, rider debited, ridesUsed unchanged → Σ(all wallets) = 0 over every wallet. AC-7 UI code verified; device pass pending per convention. (Two harness unit bugs — kobo vs the wallet API's naira — were mine, not the product's.)

## Consequences

**Positive**:
- The flagship subscription promise is real: prepaid month, free at use, driver kept whole.
- Dead metering fields (`ridesUsed`) start working; the unwired rider surface gets wired.

**Negative / tradeoffs**:
- Unlimited rides within the period until the frequency slice lands: a rider could take many covered trips a day on the route; REVENUE absorbs each driver net, so a heavy user can outrun their fee (bounded by route match; accepted until frequency config, flagged to founder).
- Endpoint radius matching is coarse; a nearby different destination rides free (1 km, tunable).

**Neutral**:
- Static plans remain listed (`listPlans`) for backward compatibility but the app no longer offers them; removal is a later cleanup.
- Old subscriptions (plan based, no route) simply never match coverage; they age out.

## Follow-up

- [ ] Founder call: fee formula constants (44 trips, 0.6 discount, ₦500 rounding) and the 1 km radius.
- [ ] Driver app: a "Covered by subscription — do not collect cash" notice on the active ride screen (the ride view now carries `coveredBySubscription`; the driver UI change is deliberately out of this slice).
- [ ] Founder call: per period ride caps before the frequency/two way slice (the heavy user exposure above).
- [ ] Later slices (already in `context/build-graph.md`): scheduler job ahead of set times, dedicated sticky → dedicated → freelance fallback, frequency and one way/two way config.
- [ ] Cleanup: retire static plans and `plans.ts` once route subscriptions are the only path.
