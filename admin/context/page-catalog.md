# Page Catalog

Pages under `app/(dash)/` (App Router). Each is gated by a **permission** (`lib/nav.ts`) and fetches via
**`adminApi`**. Status reflects what's actually built.

> The sidebar (`lib/nav.ts`) renders only items the signed-in admin's role permits; routes are guarded too.
> **The live/revenue pages render with the basic `ui/` kit — there is no Mapbox map or Recharts chart.**

## Overview
| Page | Permission | adminApi | Renders / status |
|---|---|---|---|
| `/dashboard` | `dashboard:view` | `stats` | KPI `StatCard`s |
| `/live` | `fleet:view` | `fleet` | **A `DataTable` of fleet drivers** + count StatCards — *not* a map (no Mapbox) |

## Operations
| Page | Permission | adminApi | Renders / status |
|---|---|---|---|
| `/trips` | `trips:read` | `rides` | DataTable + status filter |
| `/users` (+ `/users/[id]`) | `riders:read` | `users`, `user` | DataTable + detail page |
| `/dedicated-drivers` | `dedicated:read` | `drivers`, `createDedicated` | Roster DataTable + onboard form |
| `/tickets` | `tickets:read` | `tickets`, `updateTicket` | Inbox DataTable + reply |

## Finance
| Page | Permission | adminApi | Renders / status |
|---|---|---|---|
| `/revenue` | `finance:read` | `financeSummary` | **StatCards** (no charts — no Recharts) |
| `/payouts` | `finance:read` | `payouts` | DataTable |
| `/promotions` | `finance:manage` | — | **Placeholder** Card (no backend promo endpoint yet) |
| `/fare-config` | `finance:manage` | `fareConfig` | Read-only Card (ARCHITECTURE wanted an editor) |

## System
| Page | Permission | adminApi | Renders / status |
|---|---|---|---|
| `/admins` | `admins:manage` | `admins`, `createAdmin`, `setAdminRole`, `setAdminStatus` | Admin list + invite form, inline role change, activate/deactivate |
| `/audit` | `audit:read` | `audit` | DataTable |
| `/settings` | `settings:manage` | — | Session info + **RBAC matrix view** (client-side from `@kari/types`) |

## Auth + root
- `app/(auth)/login/page.tsx` — login form → `POST /api/admin/login`.
- `app/layout.tsx` (root layout) · `app/page.tsx` (root).

> A2–A6 are committed but **not runtime-verified**. **Admins & Roles is now built** (list / invite /
> inline role change / activate-deactivate) over `GET|POST /admin/admins` + `PATCH /admin/admins/:id/{role,status}`.
