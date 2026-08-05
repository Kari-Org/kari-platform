# 0003. Carpool discounted ride share fares

**Date**: 2026-08-03
**Status**: Accepted

## Summary

Carpool pricing changes from "split one fare equally" to "each rider pays their own discounted fare."
A rider alone pays the full fare; every extra co rider deepens everyone's discount from a fixed
occupancy table (100% alone, 80% each at two, 70% at three, 65% at four). Riders always save versus
riding solo, and the driver plus platform always collect at least the solo fare, more with company.
Settlement charges each member their own share; the rider app stops computing any split math itself
and renders server values only.

## Context

Carpool v1 divides one `totalFare` evenly across members (`recompute` writes `shareAmount = totalFare /
n`; `settle` re divides the total at completion). The foundation's ride flows and the ride type matrix
(`context/architecture.md`) call for a **discounted ride share** model instead: your fare is yours,
discounted by occupancy, full when alone. The gap is tracked in `context/build-graph.md`.

Three forces shape the fix. First, the blast set is small and fully known: `recompute` has exactly two
callers (`join`, `leave`), and settlement reads members at completion, all in
`backend/src/carpools/carpools.service.ts`. Second, the rider app has **duplicated pricing logic**:
`rider/app/carpools.tsx` computes `totalFare / seatsTaken` inline in two places, so a backend only
change would leave the app showing wrong numbers, and any client side formula will drift again later.
Third, money invariants are load bearing (`context/foundation.md` §7 #11): whatever each member pays
must post balanced kobo legs that sum exactly, and the platform side must never collect less than the
solo fare (otherwise carpooling cannibalizes solo revenue).

Not deciding leaves the shipped equal split contradicting the product's stated pricing story, and the
rider screens advertising fares the backend will not charge.

## Requirements

**User stories**:

- As a rider, I want my carpool fare to be my own discounted price so that sharing always beats riding solo and I am never surprised by someone else's route share.
- As a rider joining a carpool, I want to see what I would pay before joining so that the decision is informed.
- As the platform, I want total collections to never fall below the solo fare so that carpooling grows revenue instead of cannibalizing it.

**Acceptance criteria**:

- **AC-1**: A carpool with one active member prices that member at 100% of `totalFare` (alone = full fare), at creation and after everyone else leaves.
- **AC-2**: Occupancy discounts apply per the table (2 riders → 80% each, 3 → 70%, 4 → 65%), recomputed on every join and leave; each member's `shareAmount` is their own fare.
- **AC-3**: Settlement charges each active member exactly their `shareAmount` (kobo legs sum exactly to the collected total, ledger stays balanced); commission is taken on the collected total; the driver receives collected minus commission.
- **AC-4**: The economics invariant holds by construction: for every occupancy n, n × multiplier(n) ≥ 1, so collected ≥ solo fare (verified by observed shares at each occupancy).
- **AC-5**: The carpool view and joinable list expose `projectedShare` (what the NEXT joiner would pay); `rider/app/carpools.tsx` renders server values only: both inline `totalFare / n` computations are removed, and the active tile's share lookup is keyed by the viewing rider's own membership (`m.riderId === me.id`), not the creator's.
- **AC-6**: `rider/app/carpool/[id].tsx` shows the rider's own `shareAmount` labeled exactly "You pay" and the total labeled exactly "Trip total (collected)"; on a `CANCELLED` carpool the payment split card is hidden (nobody is charged).
- **AC-7**: Kobo exactness: every member charge is a whole kobo amount (`shareAmount × 100`) and settlement legs sum exactly to the transaction amount; since all active shares are equal by construction there is no remainder to distribute, and v1's floor plus remainder loop is deleted as dead code. Σ(all wallets) = 0 preserved.

## Options considered

### Option 1: Occupancy multiplier table on the backend, server computed `projectedShare` for the UI

A constant table (1 → 1.00, 2 → 0.80, 3 → 0.70, 4 → 0.65) applied to `totalFare` per member in
`recompute`; `settle` charges stored shares; the view adds `projectedShare` so clients never compute.

**Pros**:

- One place owns pricing; the client drift already found in `carpools.tsx` becomes impossible.
- Alone = full fare falls out of the table (multiplier(1) = 1); no special case.
- Economics invariant is checkable arithmetic on four constants.

**Cons**:

- The discount curve is fixed in code; tuning it means a deploy (acceptable pre launch; a config surface is speculative today).

### Option 2: Distance overlap pricing (each rider priced on their own route segment)

**Pros**:

- The theoretically fair model for mid route pickups.

**Cons**:

- Carpool v1 has a single pickup/dropoff per carpool (members share the creator's route); per member segments do not exist in the data model yet. This is the per rider PIN / incremental dispatch slice's territory, building it now speccs a model with no inputs.

### Option 3: Keep equal split, discount the total

**Pros**:

- Smallest diff.

**Cons**:

- Still "someone else's fare divided," not "your own fare discounted"; contradicts the product story (a rider's price would still jump when someone leaves), and alone = full fare needs a special case.

## Decision

**Chosen option**: Option 1: occupancy multiplier table, server computed shares and projections.

`CARPOOL_OCCUPANCY_MULTIPLIERS = { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65 }` in the carpools service;
`recompute` prices every active member at `round(totalFare × multiplier(n))`; `settle` charges stored
shares; the carpool view and joinable list add `projectedShare`; the rider app renders server values.

## Rationale

The multiplier table is the smallest model that satisfies the product story (your own fare, discounted
by company, full when alone) while keeping the money invariants provable: the four constants directly
encode AC-4, and settlement over stored integer shares keeps the ledger math exact. Distance overlap
pricing is the right eventual model but has no data to price against until per member pickups exist
(the later carpool slices); building the table now does not block it, because both models meet at
"members carry their own `shareAmount`." Server computed `projectedShare` exists specifically because
the explore step found the rider app re implementing pricing inline, the class of drift a shared
formula invites.

## Feature design

**Data model sketch**: no schema change. `carpool_members.shareAmount` (exists) now stores the
member's own discounted fare; `carpools.totalFare` keeps meaning "solo fare for this route/category"
(the pricing base), display label changes only.

**Pricing math** (backend, one place):

- `multiplier(n)`: the table above; n = active (JOINED) member count.
- Per member: `shareAmount = Math.round(totalFare × multiplier(n))` (naira, as today; kobo at settle).
- `projectedShare = Math.round(totalFare × multiplier(min(n + 1, maxSeats)))` — what the next joiner
  (and everyone) would pay after one more join; null when full.
- Settlement: per member kobo = `shareAmount × 100`; transaction amount = Σ member kobo; commission =
  `round(Σ × rateBps / 10000)`; driver net = Σ − commission. One debit leg per member at exactly their
  share, plus driver credit and revenue credit. v1's base plus remainder distribution loop is removed
  (all active shares are equal, so it is dead code under this model).
- Accepted risk (pre existing, inherited): `complete`/`settle` reads members outside a transaction
  shared with a concurrent `leave`'s recompute; under the new model a mid settle leave shifts charged
  amounts, not just ratios. Accepted for this slice (same window as v1, rare, bounded by one member's
  share); noted for the per rider PIN slice which reworks membership anyway.

**API surface** (shapes only; no new endpoints):
| Endpoint | Method | Change |
|---|---|---|
| /carpools (create) · /carpools/:id · /carpools/:id/join · /carpools/:id/leave | existing | view gains `projectedShare: number \| null`; `members[].shareAmount` is now the member's own discounted fare |
| /carpools?lat&lng (joinable list) | existing | each item gains `projectedShare` |

**Key invariants**:

- n × multiplier(n) ≥ 1 for every n in the table (collected never below solo fare).
- Settlement legs sum exactly to the transaction amount; Σ(all wallets) = 0 preserved.
- No client computes a fare: the rider app renders `shareAmount` / `projectedShare` only.
- multiplier(1) = 1.0 exactly (alone = full fare is not a special case).

**Security model**: unchanged (participant gated reads, NIN gate on create/join; no new surface).

**Configuration required**: none (constants in code; tuning is a founder follow up).

**Critical test scenarios**:

- Creator alone: `shareAmount = totalFare`, verifies **AC-1**.
- Join to 2 then 3: every active member at 80% then 70%; leave back to 2 → 80% again, verifies **AC-2**.
- Complete at n=2: each charged own share, ledger legs sum, commission on collected total, driver net correct, verifies **AC-3**, **AC-7**.
- Observed shares at n=1..3 satisfy n × share ≥ totalFare, verifies **AC-4**.
- Joinable list and view carry `projectedShare`; grep confirms no `totalFare /` math remains in `rider/`, verifies **AC-5**, **AC-6**.

## Build plan

Tracer bullet order (project default assumption, as before):

1. [x] Backend: multiplier table + own fare `recompute` + `projectedShare` and `collectedTotal` in the view (server computes all money figures), satisfies **AC-1**, **AC-2**, **AC-4**, shape half of **AC-5**. (2026-08-03)
2. [x] Backend: settlement charges stored shares (Σ member kobo, commission on collected total, driver net, remainder loop deleted as dead code), satisfies **AC-3**, **AC-7**. (2026-08-03)
3. [x] Rider app: `projectedShare`/`collectedTotal` on the local type; `carpools.tsx` server values only (both inline splits removed, share keyed by own membership); `carpool/[id].tsx` "You pay" / "Trip total (collected)", split card hidden when `CANCELLED`, satisfies **AC-5**, **AC-6**. (2026-08-03)
4. [x] Verified against the running backend (2026-08-03): quote ₦2250 → alone share ₦2250 (AC-1); join → both ₦1800 with projected ₦1575 (AC-2/AC-5); leave → back to ₦2250; completion posted transaction 360000 kobo with legs 2×180000 debit + 288000 driver + 72000 revenue, Σ(all wallets)=0 (AC-3/AC-7); collected 3600 ≥ solo 2250 (AC-4); `grep 'totalFare /' rider/` clean (AC-5). AC-6 labels code verified; device pass pending per convention.

## Consequences

**Positive**:

- Pricing story matches the foundation's product promise; riders always save vs solo, platform never collects less than solo.
- Removes duplicated pricing math from the client (the drift the explore found).

**Negative / tradeoffs**:

- Driver+platform revenue per rider drops as occupancy grows (by design; total still grows), and the discount curve is a guess until real usage data exists.
- Commission's base changes from `totalFare` to the collected total, so absolute commission RISES with occupancy (2 riders at 80%: commission on 160% of solo). Deliberate, but it changes driver economics messaging: the driver's net also rises with occupancy.
- `totalFare` now reads as "solo base fare," a naming wrinkle kept to avoid a column rename in this slice.

**Neutral**:

- No migration (no schema change); deploy order free.
- The later per rider pickup slice replaces the _base_ each member is priced on, not this mechanism.

## Follow-up

- [ ] Founder call: the discount curve values (80/70/65 are defaults chosen for the economics invariant; tune with real data).
- [ ] Founder call: wallet → saved card fallback at carpool settlement is still not built (settle charges wallets and can go negative like v1); it is a payment provider slice, deliberately out of scope here.
- [ ] Consider renaming `totalFare` → `baseFare` in a later cleanup (naming wrinkle noted above).
