# Kari Admin Console — ARCHITECTURE.md

The internal operations console for Kari staff. Five jobs: **(1)** real-time visibility into trips + system health, **(2)** rider/driver lifecycle + KYC verification, **(3)** financial oversight + fare config, **(4)** dedicated-driver onboarding, **(5)** a support-ticket inbox. Next.js app, `ADMIN`-role-gated, built on the **same backend + `@kari/types`** as the rider/driver apps so there is zero contract drift.

> Status: **A0–A6 built** (incl. *Admins & Roles* as of 2026-06-23). **Reconciled with code: 2026-06-08.**
>
> **As-built reconciliation:** several "locked" choices below were never implemented — **auth is a custom
> httpOnly-cookie flow, not Auth.js**; **Live Rides is a `DataTable`, not a Mapbox map**; **Revenue is
> StatCards, not Recharts**; fare-config is read-only and promotions is a placeholder. As-built detail:
> [README.md](README.md) · [page-catalog.md](page-catalog.md) · [rbac.md](rbac.md) · [ui-registry.md](ui-registry.md).

---

## Locked decisions (2026-06)

| Area | Decision |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** |
| Maps | **Not built.** Mapbox GL JS was planned; Live Rides currently renders a `DataTable` of fleet drivers (no map dependency installed) |
| UI | **Tailwind CSS 3** + a local **shadcn-style `ui/` kit** (hand-rolled in-repo, **no shadcn/Radix dependency**), dark Kari theme (brand `#FFFF00`) |
| Data | **TanStack Query** + a typed `apiFetch` mirroring the mobile client (same response envelope) |
| Realtime | **socket.io-client** on the existing gateway (`admin:fleet`, `ticket:new`) |
| Auth | **Custom httpOnly-cookie flow (NOT Auth.js).** `api/admin/login` exchanges email/password for the backend admin JWT and stores it in an httpOnly cookie; `getSession()` validates it via `/auth/me`. 12h cookie, **no refresh**. **Zoho OIDC is not wired.** |
| RBAC | **Permission-based, data-driven** — roles are permission sets in `@kari/types` (`ROLE_PERMISSIONS`); add a role or change a rule by editing **one map**. Backend guard + frontend menu read the *same* source |
| Audit | Every `/admin/*` **mutation** is logged by a Nest interceptor → `audit_logs` |
| Infra | Deployment-agnostic for now (Vercel or containerized next to the backend — decide later) |

---

## Information architecture (collapsible sidebar)

```
OVERVIEW
  • Dashboard                 dashboard:view     KPIs + system health
  • Live Rides (map)          fleet:view         real-time fleet + active trips
OPERATIONS
  • Trips                     trips:read         All · Active(override) · Disputes
  • Users                     riders/drivers:read  Riders · Drivers · Verification Queue
  • Dedicated Drivers         dedicated:read     Roster · Onboard New
  • Tickets                   tickets:read       Open · Assigned to me · Resolved
FINANCE
  • Revenue                   finance:read
  • Driver Payouts            finance:read
  • Promotions                finance:manage
  • Fare Configuration        finance:manage
SYSTEM
  • Admins & Roles            admins:manage
  • Audit Log                 audit:read
  • Settings                  settings:manage
```

Each item declares the permission that gates it; the sidebar renders only what the signed-in admin's role allows, and the matching route is guarded server- and client-side.

---

## Permission model (`@kari/types/rbac.ts`) — the contract

- **`AdminRole`**: `SUPER_ADMIN`, `OPS`, `SUPPORT`, `FINANCE`, `READ_ONLY` (stored on `User.adminRole`, surfaced in the admin JWT + `/auth/me`).
- **`PERMISSIONS`**: granular `resource:action` strings (`trips:override`, `drivers:verify`, `finance:manage`, `admins:manage`, …).
- **`ROLE_PERMISSIONS`**: `Record<AdminRole, Permission[]>` — the single editable map.
- **`hasPermission(role, perm)`**: used everywhere.

**To add a role:** add to `AdminRole` + one entry in `ROLE_PERMISSIONS`. **To change a role's rules:** edit its array. Nothing else changes — frontend nav, route guards, and the backend `@RequirePermissions()` guard all derive from this map. (v2: move the map into a DB table for runtime editing via the *Admins & Roles* page; the catalog of `PERMISSIONS` stays code-defined.)

**Enforcement:**
- Backend: `@RequirePermissions('trips:override')` + a `PermissionsGuard` that reads `user.adminRole` → `ROLE_PERMISSIONS`.
- Frontend: `<Can permission="trips:override">`, `useCan(perm)`, and nav/route filtering (`lib/nav.ts`).

---

## Module specs (functionality × backend reality)

| Module | Core functionality | Backend mapping / **gap** |
|---|---|---|
| **Dashboard** | KPI cards (active trips, online drivers, today's trips/GMV, open tickets), recent activity, health | **NEW** `GET /admin/stats` (aggregations over rides/users/Redis) |
| **Live Rides** | Mapbox: clustered drivers (online/on-trip), active-trip polylines, click→drawer, filters | **NEW** `GET /admin/fleet` (Redis GEO + active rides) + socket `admin:fleet` deltas |
| **Trips** | History (filter status/date/party), detail (timeline/map/fare/ratings), active override/cancel, disputes | **NEW** `GET /admin/rides` (filters, paginated), `GET /admin/rides/:id`, `POST /admin/rides/:id/override`. State machine + cancel already exist |
| **Users** | Riders/Drivers tables (search/filter/CSV), detail drawer (profile/trips/ratings/KYC), suspend/reactivate; **Verification Queue** approve/reject NIN+liveness | `GET /admin/drivers` ✅. **NEW** `GET /admin/riders`, `GET /admin/users/:id`, `GET /admin/users/:id/rides`, `PATCH /admin/users/:id/status`, `POST /admin/drivers/:id/verify` |
| **Dedicated Drivers** | Roster + onboard wizard | `POST /admin/drivers/dedicated` ✅, `GET /admin/drivers` ✅ (filter `driverType=DEDICATED`) |
| **Financials** | Revenue, payouts, promo CRUD, fare config | **Phase 3 (money) NOT built.** v1 = **Fare Config editor** (lift hardcoded `base + ₦120/km + ₦15/min` into a config table); revenue/payouts/promo land with Phase 3 |
| **Tickets** | Inbox (subject/category/status/assignee/thread), reply, transitions, link trip/user | **NEW** `Ticket`/`TicketMessage` entities + `POST /tickets` (app/web submit) + email ingestion + `/admin/tickets*` + socket `ticket:new`. `source ∈ {APP, WEB, EMAIL}` |
| **System / Security** | **Audit Log** (every admin write), **Admins & Roles** (invite + assign role), Settings | **NEW** `audit_logs` table + interceptor + `GET /admin/audit`; `POST /admin/admins` + `PATCH /admin/admins/:id/role` |

> **As-built note:** Live Rides ships as a `DataTable` (no Mapbox); Financials ship as StatCards/tables —
> Revenue (StatCards, no Recharts), Payouts (table), **Promotions = placeholder** (no backend endpoint),
> **Fare Config = read-only** display (the editor is unbuilt). **Admins & Roles** is now built (list /
> invite / role change / activate-deactivate). The rest of A2–A6 are built. Full page list: [page-catalog.md](page-catalog.md).

---

## Tickets — multi-source ingestion (A5)

One `Ticket` model, three intake paths, tagged by `source`:
- **App** — rider/driver submit screen → `POST /tickets` (authed).
- **Website** — public contact form → `POST /tickets/public` (captcha + rate-limit).
- **Email** — Kari contact inbox → inbound webhook (or IMAP poll) → parse → `Ticket(source=EMAIL)`; replies thread back out via the mail provider. (Provider abstraction, like SMS/maps — no-op/log in dev.)

---

## Realtime

Reuse the Socket.IO gateway. Admin joins an `admin` room on connect (after JWT auth + permission check). Server broadcasts: `admin:fleet` (driver location/availability deltas — throttled), `ride:*` lifecycle mirrors for active-trip cards, `ticket:new`. Live Rides hydrates from `GET /admin/fleet` then applies socket deltas.

## Audit logging

A global `AuditInterceptor` on `/admin/*` non-GET requests records `{ actorId, actorRole, method, path, action, targetType, targetId, before, after, ip, userAgent, at }` into `audit_logs`. Destructive/override actions require a typed **reason** (captured in the modal) stored on the entry. Surfaced filterable in *Audit Log*.

---

## Tech stack

Next.js 15 App Router · React 19 · TS · `@kari/types` (RBAC) · Tailwind CSS 3 + local shadcn-style `ui/` kit ·
TanStack Query · socket.io-client · lucide-react · **custom httpOnly-cookie auth**. *(Planned but NOT
installed: Mapbox GL JS, Recharts, react-hook-form, zod, Auth.js.)*

## Repo layout (`admin/`)

```
app/                # App Router: (auth)/login, (dash)/dashboard|live|trips|users|…
  api/admin/login|logout/route.ts    # set / clear the httpOnly cookie
  api/proxy/[...path]/route.ts        # same-origin proxy → backend with Bearer
components/          # ui/ (local kit), shell/ (Sidebar, Topbar, page-header), Can, session-provider, KariMark
lib/                 # api + admin-api, auth, query, socket, nav, env, constants
middleware.ts        # cookie-presence route gate
```

## Phased plan

- **A0 — Scaffold:** ✅ Next app, Tailwind + local ui kit, API client, **custom cookie auth** (email/JWT), backend admin auth + `adminRole` + PermissionsGuard, collapsible shell + RBAC routing.
- **A1 — Read-only ops:** ✅ Dashboard KPIs, Users (riders/drivers + detail), Trips (history + detail) over `GET /admin/*`.
- **A2 — Live Rides** (`/admin/fleet` + socket).
- **A3 — Actions + Audit** (suspend/verify/override + audit interceptor & page; audit ships with the first write).
- **A4 — Dedicated Drivers** (roster + onboard over existing endpoints).
- **A5 — Tickets** (entities + 3 intake sources + inbox).
- **A6 — Financials** (Fare Config now; revenue/payouts/promo gated on Phase 3).

> **Status (2026-06-23):** A0–A6 are all built and committed, **including *Admins & Roles*** (the last
> `ComingSoon` stub — now list / invite / role change / activate-deactivate). Phase 3 (money) IS built, so
> revenue/payouts show real data (StatCards/tables). Not yet runtime-verified.

## Local dev

Next dev server proxies to the backend (`:3000`) via `/api/proxy`. Local login uses the seeded
`admin@kari.test` / `AdminPass123!`. (Zoho SSO is not wired.)
