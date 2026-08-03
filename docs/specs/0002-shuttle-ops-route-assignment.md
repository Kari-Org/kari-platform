# 0002. Shuttle ops route assignment

**Date**: 2026-08-03
**Status**: Accepted

## Summary

Operations staff get a Shuttle page in the admin console where they assign a dedicated driver and a bus
to a shuttle route, and unassign them. Today routes and trips are seeded with no driver attached; the
trip table already has an empty `driverId` column waiting. This slice adds one new permission to the
shared types package, two admin endpoints (a routes list and one assignment endpoint that also clears),
three nullable columns on routes, and the admin page. QR boarding, route search, and the driver app's
"my route" screen are separate later slices.

## Context

The ride type matrix (`context/architecture.md`) says shuttle trips are served by dedicated drivers whom
"ops assigns bus and route via the admin app", and `context/build-graph.md` lists this as a buildable
gap. In code today: `shuttle_routes` (name, corridor, active) and `shuttle_trips` (route, departAt,
seats, **`driverId` nullable and never written**, status) are seeded on boot; no endpoint or screen
writes `driverId`, and no bus concept exists anywhere in the schema.

Forces. First, the admin console already has the machinery this needs: a `PermissionsGuard` driven by
the shared `PERMISSIONS` catalog in `@kari/types` (`rbac.ts`), an audit interceptor on admin writes, a
dedicated drivers roster (`GET /admin/drivers`, `POST /admin/drivers/dedicated`), and a nav gated per
permission. Second, the permission catalog is a shared contract: backend guard, the admin `<Can>`
component, and the settings RBAC matrix all iterate it, so adding a permission ripples through three
consumers automatically. Third, there is no Bus entity, and the car category enum cannot host a BUS
value safely (pricing iterates every category to build fare tiers, so a new member would leak into ride
quotes).

Not deciding leaves shuttle v1 unassignable: trips run with no driver on record, and the later QR and
driver app slices have nothing to hang an assignment on.

## Requirements

**User stories**:
- As an operations admin, I want to assign a dedicated driver and a bus to a route so that every upcoming trip on that route has a responsible driver and vehicle.
- As an operations admin, I want to unassign or replace a route's driver so that staffing changes are reflected quickly.
- As a compliance reviewer, I want every assignment change audit logged so that staffing actions are traceable.

**Acceptance criteria**:
- **AC-1**: `@kari/types` exposes a new `shuttle:assign` permission, granted to `SUPER_ADMIN` (automatic) and `OPS`; the settings RBAC matrix shows it without further admin code changes.
- **AC-2**: `GET /admin/shuttle/routes` returns every route with its assignment (driver id and name, bus fields) and its count of upcoming `SCHEDULED` trips; readable with `dedicated:read`.
- **AC-3**: `PATCH /admin/shuttle/routes/:id/assignment` with a dedicated driver and bus details persists the assignment on the route and stamps `driverId` on that route's future `SCHEDULED` trips.
- **AC-4**: Assigning a driver whose profile is not `DEDICATED`, or whose user account is not `ACTIVE`, returns 400 and changes nothing.
- **AC-5**: The same endpoint with `driverId: null` clears the route's assignment and nulls `driverId` on its future `SCHEDULED` trips; completed or cancelled trips are untouched.
- **AC-6**: The mutation requires `shuttle:assign`; an admin without it (e.g. `SUPPORT`, `FINANCE`) gets 403.
- **AC-7**: The admin console gains a Shuttle page (nav item, `dedicated:read` to view) listing every route (active and inactive) with corridor, active flag, assigned driver, bus, and upcoming trip count; the assignment controls render only for holders of `shuttle:assign` (via `<Can>`).
- **AC-8**: Trips seeded after an assignment inherit the route's driver (the seeder reads the route's assignment when creating trips).
- **AC-9**: Assignment changes appear in the audit log with the actor and the request payload (what the existing audit interceptor records).
- **AC-10**: A dedicated driver already assigned to another route cannot be assigned again; the endpoint returns 409 until they are unassigned (one driver, one route).

## Options considered

### Option 1: Standing assignment on the route, trips inherit

Add `assignedDriverId`, `busPlateNumber`, `busLabel` to `shuttle_routes`; assign/unassign endpoints
stamp future `SCHEDULED` trips and the seeder inherits.

**Pros**:
- Matches the ops mental model ("this driver runs the Lekki corridor"), one action covers all trips.
- Uses the existing empty `shuttle_trips.driverId` column as designed; no new table.

**Cons**:
- One driver per route (no per trip override this slice); a substitute driver for a single day needs a later per trip surface.

### Option 2: Per trip assignment only

An endpoint that sets `driverId` trip by trip, and an admin table of trips.

**Pros**:
- Maximum flexibility (substitutes, split shifts).

**Cons**:
- Operationally tedious as the default (trips are seeded in batches; ops would repeat the same assignment daily), and the vision text describes route level assignment.

### Option 3: A dedicated `shuttle_assignments` entity (driver, bus, route, effective dates)

**Pros**:
- Models history and future dated assignments cleanly.

**Cons**:
- A new table, joins, and lifecycle for a capability the product hasn't validated yet; the audit log already records the history this slice needs (speculative abstraction).

## Decision

**Chosen option**: Option 1: standing assignment on the route, trips inherit.

Route level assignment with inline bus fields, a new `shuttle:assign` permission in the shared RBAC
catalog, three admin endpoints in the existing admin module, and a Shuttle page in the admin console.

## Rationale

Route level assignment is the shape the foundation describes and the seeded trip model supports; the
empty `driverId` column on trips was built for exactly this write path. Inline bus fields (plate and a
free label) beat both a Bus entity (nothing else needs one yet) and extending the car category enum
(which would corrupt fare quoting, since pricing builds a fare per category). The permission goes into
`@kari/types` because that catalog is the single RBAC contract all three consumers already iterate;
gating reads behind the existing `dedicated:read` keeps read access aligned with the roster page ops
already use. Validation returns 400 (a bad request about the target driver), distinct from 403 (the
caller lacking `shuttle:assign`), so clients can tell policy from input errors.

## Feature design

**Data model sketch**:
- `shuttle_routes`: add `assignedDriverId uuid NULL`, `busPlateNumber varchar(20) NULL`, `busLabel varchar(60) NULL`. Dev applies via `DB_SYNCHRONIZE`; production ships a TypeORM migration (additive, nullable, safe).
- `shuttle_trips`: no schema change; the existing `driverId` column starts being written.
- `@kari/types` `rbac.ts`: `'shuttle:assign'` added to `PERMISSIONS`; `ROLE_PERMISSIONS[OPS]` gains it; `SUPER_ADMIN` inherits automatically.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /admin/shuttle/routes | GET | (none) | ALL routes (incl. inactive) with assignment + upcoming `SCHEDULED` trip counts | bearer, `dedicated:read` | 403 |
| /admin/shuttle/routes/:id/assignment | PATCH | `driverId: uuid \| null` (req), `busPlateNumber?: string` (req when assigning), `busLabel?: string` | updated route view | bearer, `shuttle:assign` | 400 not dedicated or not active, 404 route or driver, 409 driver already assigned elsewhere, 403 |

One endpoint covers assign and clear (`driverId: null`): one audit action, less controller surface (the
cross check's simplification, adopted).

**Key invariants**:
- Only a driver whose profile is `DEDICATED` and whose user account is `ACTIVE` can hold a shuttle route assignment.
- One driver holds at most one route (409 on a second assignment until cleared).
- Assignment changes update the route and its future `SCHEDULED` trips in one transaction (no route/trip drift).
- Past or non scheduled trips (`COMPLETED`, `CANCELLED`, in progress) are never rewritten.
- The permission catalog change is additive; no existing role loses a permission.
- Accepted risk: concurrent admin edits of the same route are last write wins (`ShuttleRoute` has no version column; admin writes are rare and audit logged, so optimistic locking is deliberately not added here).

**Security model**:
- Reads: `dedicated:read` (OPS, SUPER_ADMIN, READ_ONLY see the page).
- Writes: `shuttle:assign` (OPS, SUPER_ADMIN), enforced by the existing `PermissionsGuard`; UI controls wrapped in `<Can permission="shuttle:assign">`.
- All writes flow through the existing admin audit interceptor (AC-9); no new PII (plate numbers are operational data).

**Configuration required**: none (no new env vars).

**Critical test scenarios**:
- Happy path: assign a dedicated driver + bus → route shows assignment, future `SCHEDULED` trips carry `driverId`, audit row exists, verifies **AC-3**, **AC-9**.
- Validation: assign a freelance driver → 400, route and trips untouched, verifies **AC-4**.
- Permission: a `SUPPORT` admin calling assign → 403; a `READ_ONLY` admin sees the page but no controls, verifies **AC-6**, **AC-7**.
- Unassign: clears route fields and future trip `driverId`, leaves completed trips untouched, verifies **AC-5**.
- Inheritance: run the seeder after assigning → new trips carry the driver, verifies **AC-8**.

## Build plan

Tracer bullet order (no recorded approach; end to end default noted):

1. [x] `@kari/types`: `'shuttle:assign'` added to `PERMISSIONS` and `ROLE_PERMISSIONS[OPS]`; package rebuilt, satisfies **AC-1**. (2026-08-03)
2. [x] Backend wiring: `ShuttleModule` exports `ShuttleService`; `AdminModule` imports `ShuttleModule`, satisfies (enables) **AC-2**. (2026-08-03)
3. [x] Backend: three nullable columns on `ShuttleRoute`; `setRouteAssignment` (assign/clear, transactional trip stamping, exclusivity 409) + `listRoutesWithAssignments` (all routes) in the shuttle service; driver eligibility (DEDICATED + ACTIVE) in the admin service; `seed()` stamps `driverId` from the route assignment; `GET /admin/shuttle/routes` + `PATCH /admin/shuttle/routes/:id/assignment` with `@RequirePermissions` + `@Audit`, satisfies **AC-2** to **AC-6**, **AC-8** to **AC-10**. (2026-08-03)
4. [x] Admin: Shuttle nav item (Bus icon, `dedicated:read`) + `/shuttle` page (routes table, assign form fed by the dedicated roster, clear action, `useCan('shuttle:assign')` gating), satisfies **AC-7**. (2026-08-03)
5. [x] Verified against the running backend (2026-08-03): AC-1 to AC-6 and AC-8 to AC-10 proven at runtime (real admin login, real dedicated driver onboarded via the admin endpoint, assignment lifecycle observed incl. 400 freelance, 409 exclusivity, 403 SUPPORT, audit rows, trip stamping and reseed inheritance confirmed in the live schema). AC-7 is code verified (typecheck green); browser pass pending per repo convention.

## Consequences

**Positive**:
- Shuttle trips gain a responsible driver on record, unblocking the QR boarding and driver app "my route" slices.
- The RBAC catalog pattern proves out for new permissions (one line in types ripples to guard, `<Can>`, and the matrix).

**Negative / tradeoffs**:
- One driver per route: single day substitutions need a per trip override later (recorded as follow up).
- Bus data is two loose fields, not a registry; plate typos are possible until a Bus entity exists.

**Neutral**:
- `@kari/types` change requires the package rebuild before backend or admin typechecks (existing standing instruction).
- Production rollout: additive nullable columns, safe to migrate before deploy.

## Follow-up

- [ ] Founder call: does a per trip driver override (substitute for one day) matter before launch, or after QR boarding?
- [ ] Founder call: a real Bus registry (capacity, photos, documents) versus the inline plate + label fields chosen here.
- [ ] Driver app read surface ("my assigned route" on the shuttle screen) is deliberately out of this slice; schedule it with the QR boarding slice.
