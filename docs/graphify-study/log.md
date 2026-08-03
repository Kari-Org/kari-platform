# Graphify before/after study — running log

> Honest, as-it-happens log for the Medium/LinkedIn piece on integrating
> [Graphify](https://github.com/Graphify-Labs/graphify) into Kari.
> **Thesis under test — "the two memories":** the curated context system (`context/`, the WHY,
> authoritative) vs. Graphify's derived code graph (the WHAT-IS, comprehensive but advisory).
> **The specific bet:** in a 7-workspace monorepo, cross-workspace dependency tracing is where a graph
> should beat grepping. Metrics logged per slice: workspaces/files opened during explore, explore turns,
> missed-consumer / re-derived-link moments.
> Rules: real slices only (all from `context/build-graph.md`), built normally via build-flow
> (architect → develop → check verify); Graphify strictly advisory; log honestly, including where it
> doesn't help.

---

## Phase 0 — Orientation & baseline setup (2026-08-03)

**Scale check (is the study worth running here?):** 383 TS/TSX source files across 7 workspaces —
backend 183 · rider 76 · driver 44 · admin 44 · web 14 · @kari/types 4 · @kari/mobile-core 18. Plus a
mature curated context system (`context/`: foundation v1 converged, architecture with the ride-type
matrix, build-graph, progress-log). **Verdict: yes.** The backend alone is ~25 NestJS modules; every
feature slice crosses at least backend + `@kari/types` + one app, and the types package is consumed by
all five products — exactly the "who consumes this contract?" shape the study needs.

**Baseline exploration tooling (the "before" condition):** Glob/Grep/Read + the curated context docs.
No graph.

**Slice selection (from build-graph.md, not invented for the study):**
- **B1 (before):** Carpool v2 — driver carpool-mode toggle. Backend + `@kari/types` + driver app.
- **B2 (before):** Shuttle v2 — ops assigns driver→bus→route in admin. Backend + `@kari/types` + admin.
- **A1/A2 (after):** comparable spans, chosen at Phase 2 from the same graph (candidates: carpool
  discounted ride-share fares; subscription per-route pricing; carpool per-rider PIN).

Ship convention for the study: each slice is committed locally on main (repo convention); pushing is
left to the founder.

---

## Slice B1 — Carpool v2: driver carpool-mode toggle (BEFORE, no graph)

### Explore step (architect phase) — measured

- **Workspaces opened:** 3 (backend, driver, packages/types).
- **Explore rounds (tool-call rounds):** 6 — 3 multi-grep sweeps, 3 read rounds.
- **Files fully read:** 5 (`matching.service.ts`, `carpools.service.ts`, `availability.controller.ts`,
  `driver-profile.entity.ts`, `availability.store.ts`).
- **Files grep-peeked:** ~9 (`endpoints.ts`, `home.tsx`, `driver.service.ts`, `carpool.tsx`,
  `useDriverDispatch.ts`, `driver.controller.ts`, `enums.ts`, `carpool.store.ts`, `useDispatchChannel.ts`).
- **Cross-package links re-derived by hand:** the `@kari/types` enum surface (which enums exist for
  driver/carpool state) and the socket event name (`carpool:offer`) had to be grepped across two
  workspaces to connect backend emitter → driver-app listener.
- **The near-miss (the honest one):** I designed the `findCandidates` change *before* checking who else
  calls it. Only a deliberate last-minute grep revealed the second consumer —
  `rides.service.ts:192` (solo dispatch) — which a naive signature change would have broken. Nothing in
  the curated context enumerates function-level consumers; experience prompted the check, not the docs.
  **This is exactly the query a code graph should answer unprompted.**
- **What the curated context DID give me free:** where availability lives (architecture.md's monorepo
  map), the eligibility rule being violated (ride-type matrix), the invariant that solo must not change
  (foundation §5). The WHY layer needed zero exploration. The WHAT-IS layer (call sites, consumers,
  event listeners) was all manual grepping.

### Design outcome

Spec: `docs/specs/0001-driver-carpool-mode-toggle.md` (8 ACs). Cross-check critique (read-only pass)
caught 2 real issues I'd missed: the fixed `GEOSEARCH limit*3` over-fetch window would starve carpool
dispatch once the selective filter lands, and two ACs bundled backend+app claims. Also surfaced during
explore: **matching filters by neither `driverType` nor carpool mode today** — dedicated drivers
currently receive carpool offers; the docs claimed the rule, the code didn't enforce it.

### Develop step — measured

- **Additional files opened beyond the architect explore:** 3 (`driver.service.ts` full,
  `home.tsx` full, a grep-peek at `driver/src/api/types.ts` + tokens.ts). The architect-phase map
  carried over, so develop needed almost no re-exploration — **within one session.** (The cost repeats
  from scratch every fresh session; that's what the graph is supposed to amortize.)
- **Files changed:** 9 across 2 workspaces (backend: entity, driver.service, availability.controller,
  new carpool-mode.dto, matching.service, carpools.service · driver: types.ts, endpoints.ts, home.tsx).
- **Friction:** one stale-knowledge stumble — backend typecheck failed until `@kari/types` was rebuilt
  (the AGENTS.md standing instruction existed; I hit the error first anyway).

### Verify step (check verify) — result: PASS (calibrated)

Real backend on fresh Docker Postgres/Redis; 3 users created through the real signup+OTP flow (OTPs
harvested from the noop-SMS log); drivers seeded to onboarding-complete via SQL. Evidence-backed:

- AC-1 ✅ toggle 200 `{carpoolMode:true}`, persists on re-read
- AC-2 ✅ carpool `dispatchedTo=1` with an opted-out freelance online beside an opted-in one; still
  `dispatchedTo=1` after flipping driver B to DEDICATED **with carpoolMode forced true in DB** (the
  adversarial case)
- AC-3 ✅ solo `dispatchedTo=2` (both drivers reached; no new filters leak into solo)
- AC-4 ✅ 403 FORBIDDEN for the dedicated driver on the toggle endpoint
- AC-5 ✅ `/drivers/me` returns `carpoolMode` · AC-6 ✅ offline toggle 200 + persisted
- AC-7/AC-8 ⚠️ code-verified only (typecheck green); device pass pending — repo convention, flagged.

One verify-harness bug worth logging (not a product bug): my OTP regex first matched the pino PID, not
the code. Runtime verification finds this class of thing; grepping never does.

**B1 slice total: ~19 files touched/read across 3 workspaces to change 9. Explore share of the work:
roughly a third of all tool rounds.**

---

## Slice B2 — Shuttle v2: ops route assignment (BEFORE, no graph)

### Explore step (architect phase) — measured

- **Workspaces opened:** 3 designed-for (backend, packages/types, admin) + 1 peeked (driver).
- **Explore rounds:** 4 (each a multi-grep + read batch).
- **Files fully read:** 3 (`shuttle-trip.entity.ts`, `shuttle-route.entity.ts`, rbac.ts §§).
- **Files grep-peeked:** ~8 (`shuttle.controller/service`, `admin.controller`, `nav.ts`,
  `admin-api.ts`, driver `shuttle.tsx`, dedicated-drivers page dir).
- **Cross-package discovery that mattered:** the `PERMISSIONS` catalog in `@kari/types` is consumed by
  THREE downstream surfaces (backend `PermissionsGuard`, admin `<Can>`, admin settings RBAC matrix). I
  know this from having read the admin docs earlier — the curated context asserts it, but enumerating
  the actual consumer files still required grep. "Who consumes this exported const?" is a one-query
  graph question.
- **What the cross-check subagent caught that MY explore missed (the headline for the piece):** 2
  code-contradictions — (a) the shuttle **seeder creates trips without reading route assignment**, so
  spec-as-drafted's AC-8 was unimplementable without a change I hadn't planned; (b) **`ShuttleModule`
  exports nothing and `AdminModule` doesn't import it** — the admin controller literally cannot inject
  the shuttle service today. Both are *edge queries* (module-import edges, call edges) that I failed to
  derive by hand on the first pass, caught only by a second full read. A dependency graph answers both
  mechanically. Plus 5 more design issues (audit payload shape, driver-status check, exclusivity,
  active-filter ambiguity, a simpler single-endpoint shape — adopted).

### Design outcome

Spec: `docs/specs/0002-shuttle-ops-route-assignment.md` (10 ACs) — new `shuttle:assign` permission in
`@kari/types` (a genuine shared-contract change rippling to 3 consumers), route-level standing
assignment, PATCH endpoint, admin Shuttle page.

### Develop step — measured

- **Additional files opened beyond architect explore:** 6 full/partial reads (`shuttle.service.ts` full,
  `shuttle.module.ts`, `admin.module.ts`, `admin.service.ts` header+section, `admin.controller.ts`
  header, `dedicated-drivers/page.tsx` full, `nav.ts`, `admin-api.ts` sections, `create-admin.dto.ts`).
  Develop re-exploration was HIGHER than B1 because the admin workspace's conventions (DataTable,
  Can/useCan, PageHeader, admin-api types) all had to be absorbed by reading a sibling page.
- **Files changed:** 11 across 3 workspaces (types: rbac.ts · backend: route entity, shuttle service,
  shuttle module, admin module, admin service, admin controller, new DTO · admin: nav, admin-api, new
  /shuttle page).
- **Friction:** the `CreateAdminDto` field name (`adminRole`, not `role`) cost one failed verify leg +
  one file read — an API-contract lookup a graph with DTO nodes could have answered.

### Verify step (check verify) — result: PASS (calibrated)

Runtime evidence (real admin login; dedicated driver onboarded through the real admin endpoint):
- AC-1 ✅ `shuttle:assign` in built PERMISSIONS, OPS granted, SUPER_ADMIN inherits
- AC-2 ✅ routes list with assignment + trip counts (200, 2 routes)
- AC-3 ✅ assignment persisted; **all 3 future SCHEDULED trips stamped with driverId (live-schema query)**
- AC-4 ✅ freelance target → 400 · AC-10 ✅ second route, same driver → 409 · AC-6 ✅ SUPPORT → 403
- AC-5 ✅ `driverId:null` wipes driver + bus · AC-9 ✅ audit row for `shuttle.route.assignment`
- AC-8 ✅ deleted a future trip, restarted backend → **reseeded trip inherited the assigned driver (3/3)**
- AC-7 ⚠️ admin page code-verified (typecheck); browser pass pending per convention
- Harness bug (mine, again instructive): wrong `POST /admin/admins` field name produced a false FAIL
  first; the fix required reading the DTO — the "what is this endpoint's contract?" query class.

**B2 slice total: ~26 files touched/read across 4 workspaces (3 changed) to change 11. The two
code-contradictions the cross-check caught (module wiring, seeder behavior) are the strongest baseline
evidence: manual explore missed real dependency edges that had to be recovered by a second full read.**
