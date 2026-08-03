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

---

## Phase 1 — Graphify integration (2026-08-03)

**Commands (verified against the README first — worth doing: the package is `graphifyy`, double-y):**
- `brew install uv` (machine had no uv/pipx) → `uv tool install graphifyy` → later
  `uv tool install --force "graphifyy[mcp]"` because the HTTP MCP transport needs an extra
  (`mcp + starlette + uvicorn`) the base install omits. **Friction logged: two installs.**
- `graphify install --platform claude` (registers the `/graphify` skill — it hot-registered into the
  running session), `graphify claude install` (always-use directive), `graphify hook install`
  (post-commit + post-checkout hooks + a git merge driver for graph.json).

**Index build (`graphify update .`):** 466 files → **3,525 nodes, 7,072 edges, 277 communities in
6.9 seconds**, 100% AST-extracted, **token cost 0** — the "LLM cost to index" worry was wrong for code
(LLM is only used for docs/community-labeling, both optional). It also indexed `context/*.md` and
`docs/specs/*.md` as first-class nodes. 4 config files produced zero nodes (known issue, logged by the
tool itself).

**MCP server:** `graphify-mcp graphify-out/graph.json --transport http --port 8199` exposes
`query_graph, get_node, get_neighbors, get_community, god_nodes, graph_stats, shortest_path` (+ PR
tools). Verified over HTTP. In-session queries also available via the identical CLI
(`graphify query/affected/path/explain/god-nodes`).

**Guardrails:** `graph.json`/`graph.html` gitignored; one fence added to `AGENTS.md` — derived,
advisory, foundation wins, and explicitly NOT `context/build-graph.md` (different altitude).

**Sanity replay of the two baseline near-misses:**
- B1 ("who calls `findCandidates`?"): `graphify query` returned BOTH callers as explicit edges with
  file:line — `carpools.service.ts:L116` and `rides.service.ts:L192`. In the baseline this took a
  deliberate late grep that almost didn't happen.
- First-try friction: bare symbol names (`affected "findCandidates"`) failed with "no unique node
  match" — node labels are qualified (`.findCandidates()`); natural-language `query` works better than
  exact-match `affected` until you know the label format.

---

## Slice A1 — Carpool v2: discounted ride-share fares (AFTER, graph-first)

### Explore step (architect phase) — measured

**Contamination note (honest):** `carpools.service.ts` was fully read during B1 this same session, so
the backend half of this slice cost me nothing *this time* — but that's session memory, not the graph.
The clean comparison is the RIDER side, untouched all session.

**Graph queries run (6 total, ~40s wall):**
1. `query "where is carpool shareAmount computed…"` — **WEAK**: generic terms (backend, Rider) seeded a
   394-node BFS of noise. Lesson: NL queries need distinctive anchors.
2. `explain "recompute"` — **CRISP**: the full caller set of the split function in one shot —
   `.join()` L156, `.leave()` L181, nothing else. This is the entire blast radius of the pricing
   change, enumerated mechanically. Baseline equivalent: reading the whole 300-line service.
3. `query` for rider carpool surfaces (NL) — weak again.
4. `explain "carpoolsApi"` → ambiguous (2 matches, driver + rider) → **the disambiguation error itself
   was informative** (told me the driver app also has a carpoolsApi).
5. `explain "rider_src_api_endpoints_carpoolsapi"` — **CRISP + the money result**: every rider-side
   consumer enumerated: `carpools.tsx`, `carpool/[id].tsx`, **and `book.tsx`** — the third one I would
   plausibly have missed by name-based file guessing (booking creates carpools). One query replaced
   opening/grepping the rider app's 76 files.
6. Targeted grep over exactly those 3 files (graph-directed) → found the headline defect: `carpools.tsx`
   **duplicates the equal-split formula inline in 2 places** — client-side drift the slice must kill.
   The graph pointed at the files; the *judgment* that inline math = duplicated business rule is still
   human/model work. Honest boundary of the tool.

**Files opened: 3 (all graph-named). Baseline B1 for the same phase: 6 rounds, 5 full reads + 9 peeks
across guessed locations.** Explore cost roughly halved, and the miss risk (book.tsx) went to zero for
the enumerable part.

### Design outcome

Spec: `docs/specs/0003-carpool-discounted-rideshare-fares.md` (7 ACs) — occupancy multiplier table
(1.0/0.8/0.7/0.65), server-computed `projectedShare`, client split-math removal. Cross-check caught 6
more issues (untestable AC-7 remainder clause, CANCELLED display, commission-base rise, settle/leave
race inheritance, wrong-keyed share lookup, unpinned label strings) — all folded in.

### Develop + verify — measured

- **Develop re-exploration: 3 tool rounds** (rider type shape, the two edit sites, the "how does this
  screen know who I am" lookup — `rider-me` vs `auth-me`, an in-file fact no graph carries). Compare
  B1 develop's 3 reads / B2's ~9: A1 is the lightest so far, partly graph, partly session memory.
- **Files changed:** 5 across 2 workspaces (backend: carpools.service · rider: types, carpools.tsx,
  carpool/[id].tsx — plus a mid-build improvement: `collectedTotal` moved server-side when I caught
  myself writing a client-side `reduce` over money).
- **Verify: PASS (calibrated).** Live evidence: alone=₦2250 full fare; n=2 both ₦1800 (80%),
  projected ₦1575 (70%); leave→₦2250; settle posted 360000 kobo = 2×180000 debits + 288000 driver +
  72000 revenue; **Σ(all wallets)=0**; `grep 'totalFare /' rider/` clean.
- **Ops friction worth logging:** a zombie nest process on :3000 nearly had me verifying against stale
  code (expired-token 401s masked it at first). Runtime verification caught the environment lie;
  no graph would have.

## Slice A2 — Subscription v2: route pricing + free-at-use (AFTER, graph-first)

### Explore step — measured

**Graph queries: 3. Files opened before writing the spec: 2 full + 3 grep-peeks. All graph-directed.**
1. `explain "SubscriptionsService"` — the complete service map (7 methods with line numbers) + both
   consumers (`rides.service.ts` imports it — the sticky-driver AND future settlement seam;
   `subscriptions.controller.ts`) in ONE query. Baseline equivalent: 2–3 file reads.
2. `explain "rider_src_api_endpoints_subscriptionsapi"` — **the study's single best moment: degree 1,
   zero importers.** The graph said no rider screen imports the subscriptions API. Grep confirmed:
   `subscriptions.tsx` + `subscription-new.tsx` run on a SAMPLE-seeded local Zustand store — the
   entire rider subscription surface was never wired to the backend, despite the progress tracker
   listing rider P4 as complete. My curated context could not know this (it records intent, not
   wiring); manual explore might have found it only when something broke at runtime. **A one-second
   structural query exposed a false "done."**
3. `query` for the settlement path — pointed into `money/payments.service.ts` (`settleRide`,
   `SettlementResult`), the single seam where free-at-use hooks in.

### Design outcome

Spec 0004 (8 ACs): route-priced subscription from a real quote (fee formula over the ECONOMY fare),
free-at-use at the settlement seam with the driver paid their normal net from REVENUE, rider screens
wired to the real API (placeholder store deleted). Cross-check caught 7 issues pre-build — the
standout: **cash double-pay** (a covered ride left as CASH lets the driver collect cash AND the funded
net) — plus fare-basis ambiguity, UI pickers for settings the backend ignores, min-vs-ECONOMY fare
pinning, a drift-prone parallel settlement path (collapsed into `settleRide(source)`), the unshared
haversine, and a too-weak Σ-invariant test.

### Develop + verify — measured

- **Develop re-exploration: ~7 rounds** — more than A1 because the slice touched 5 areas (subscriptions,
  money, rides, rider screens ×3) and required precise DTO/controller/entity reads. The graph located
  everything; the reads were for exact code shapes (a thing the graph doesn't carry).
- **A structural save mid-build:** injecting `PricingService` into `SubscriptionsService` would have
  created a module cycle (`RidesModule → SubscriptionsModule → RidesModule`). I caught it from
  session knowledge of module imports — but this is precisely a `shortest_path`/edge query; logged as
  a **missed opportunity to use the graph** (honesty cuts both ways).
- **Another consumer catch:** deleting the placeholder store surfaced a third consumer — rider
  `home.tsx` line 77 — via grep. The graph's store-node importers would have listed it up front had I
  queried before deleting.
- **Files changed:** 13 across 2 workspaces (backend 8: subscriptions entity/service/controller/DTO,
  payments, rides service + entity, new common/geo.ts, carpools import swap · rider 5: two screens
  rewritten, home tab, types, endpoints; 2 files deleted).
- **Verify: PASS (calibrated).** Real top-up → formula-exact fee (₦59,500 from ₦2,250 solo) → covered
  reverse-direction ride with rider balance untouched, driver paid ₦1,800 net from a REVENUE debit
  (ledger legs shown), CASH request forced to WALLET (the cross-check's double-pay hole, proven
  closed), ridesUsed metered, far ride charged normally, **Σ(all wallets)=0 across every wallet**.
  Two FAILs in the run were my harness's kobo-vs-naira unit bugs — the DB ledger showed the product
  correct. Runtime verification catches harness lies too.

---

# Phase 3 — Synthesis (2026-08-03)

## The before/after, side by side

| Metric (explore/architect phase) | B1 (before) | B2 (before) | A1 (after) | A2 (after) |
|---|---|---|---|---|
| Explore rounds | 6 | 4 | 6 queries + 1 grep round | 3 queries + 2 reads + 3 peeks |
| Files fully read to map the slice | 5 | 3 | 0 new (3 grep-peeks, graph-named) | 2 (graph-named) |
| Files opened on guesses (not pointers) | ~14 | ~11 | 0 | 0 |
| Consumers missed / near-missed | 1 near-miss (`rides.service` caller) + 2 caught only by cross-check (module wiring, seeder) | same 2 | 0 (book.tsx enumerated) | 0 (unwired screen FOUND) |
| Workspaces swept by hand | 3 | 3–4 | 0 (queries crossed them) | 0 |

The explore cost didn't just shrink — it changed shape. Before: sweep directories, grep names, read
whole files to build a mental map, then *hope* the map is complete. After: ask for the map
(`explain <symbol>` = callers/importers with file:line), then read only the 2–3 files whose exact
*shapes* matter. Reading for shape is cheap and bounded; sweeping for structure was the expensive,
error-prone part, and that's the part the graph deleted.

## The single best moment

**`explain "rider_src_api_endpoints_subscriptionsapi"` → Degree: 1 (zero importers).** One second of
graph query revealed that the rider app's entire subscription surface — two screens plus a home-tab
card — was running on a SAMPLE-seeded local store and had **never been wired to the backend**, while
the progress tracker recorded rider P4 as complete. The curated context couldn't know (it records
intent and decisions, not wiring); grepping wouldn't have flagged it (the screens *work*, on fake
data); runtime testing would have found it only if someone thought to test that specific screen
against the server. A structural absence — an edge that should exist and doesn't — is something only
a graph surfaces cheaply. That finding reshaped slice A2's scope and is now shipped code.

Runner-up: `explain "recompute"` returning the complete 2-caller blast set for the fare-split change —
the exact query class whose manual version I *almost skipped* in B1 (the `findCandidates` near-miss).

## Honest frictions (the piece needs these)

1. **Natural-language queries are hit-or-miss.** Generic terms ("backend", "rider") seed noisy
   394-node BFS traversals. The crisp tool is `explain` on a known symbol — which means you need a
   name first. The graph is a *resolver*, not a search engine; you still need one grep or one guess
   to get the first anchor.
2. **Node naming needs learning.** Bare `affected "findCandidates"` fails ("no unique node match");
   labels are qualified (`.findCandidates()`) and ambiguity errors want full node ids. ~3 failed
   queries before the pattern stuck. (The ambiguity error listing both candidates was itself useful once.)
3. **Install had a pothole.** HTTP MCP transport needs `graphifyy[mcp]`, a second install the README's
   quickstart doesn't mention. And the package name's double-y will typo someone.
4. **Two misses the graph can't take credit for fixing:** the A2 module cycle (RidesModule ↔
   SubscriptionsModule) — a textbook `shortest_path` question I answered from session memory instead
   of querying (tool habits lag tool availability); and the third store consumer (home.tsx) found by
   grep after I'd already committed to deletion.
5. **What the graph doesn't carry:** exact code shapes (DTO field names — `adminRole` not `role` cost
   a failed verify leg), in-file facts (which query key a screen uses), semantics (that inline
   `totalFare / n` math *duplicates a business rule* — the graph pointed at the file; the judgment was
   still on me), and environment truth (the zombie process serving stale code — only runtime
   verification caught that).
6. **Index cost: a non-issue for code.** 6.9s, zero tokens, 466 files. The "LLM cost to index" worry
   applied only to optional doc-labeling. Post-commit hook rebuilds are background and unnoticeable.

## Where Graphify added value BEYOND the curated context (the thesis answer)

The two memories turned out to be different *altitudes*, and the gap between them is exactly where
the four slices' bugs lived:

- `context/` (curated, authoritative) answers **why and what-should-be**: the eligibility rule exists
  (§5), Redis is ephemeral (§7 #11), the ride-type matrix. It's the layer that told me carpool
  dispatch filtering *ought* to exist — and it was right that the code violated it.
- `graphify-out/` (derived, advisory) answers **what-is at the file/symbol level**: who actually
  calls `findCandidates` (2 sites), who consumes `PERMISSIONS` (3 surfaces), whether
  `subscriptionsApi` has any importers at all (none!), which module exports what (ShuttleModule
  exported nothing — admin literally couldn't inject it).
- **The failures of the baseline were precisely edge-enumeration failures**: B1's near-missed second
  caller, B2's two cross-check catches (a missing module edge, a seeder that ignored a field). Every
  one is a one-query graph answer. In the after-slices, that failure class went to zero — the
  cross-checks still found real issues, but they were *semantic* (cash double-pay, fee-basis
  ambiguity, untestable ACs), never structural. The graph took the structural class off the table
  and left the reviewers free to catch the semantic class.
- The tension resolution never needed invoking: the graph never *disagreed* with foundation.md —
  it disagreed with the **progress tracker's optimism** (rider P4 "complete") and with **doc claims
  about code** (the eligibility rule). In both cases the rule held: foundation states intent, the
  graph states reality, and the delta between them is the work list.

**Verdict for the piece:** the curated context made the graph *more* valuable, not redundant — the
WHY layer told me which WHAT-IS queries mattered. And the graph's best trick isn't finding what's
there; it's proving what *isn't* (no importers, no export, no filter). Absences are invisible to
grep and to curated docs alike.

## Ship record

- B1 `7d374cc` carpool-mode toggle (spec 0001) · B2 `f5876fb` shuttle ops assignment (spec 0002)
- Graphify integration `5c01921` · A1 `e14893b` discounted ride-share fares (spec 0003)
- A2 `cc71661` subscription route pricing + free-at-use (spec 0004)
- All four slices runtime-verified against a live backend with ledger-level evidence; mobile/admin UI
  device passes pending per repo convention (tracked in each spec).
