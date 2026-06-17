# UI Registry

The admin renders with **Tailwind CSS 3** (not v4) + a small **local shadcn-style `ui/` kit** (the
components are hand-rolled in-repo — no external shadcn/Radix dependency). Dark Kari theme.

## `components/ui/` — the primitive kit
| Component | Use |
|---|---|
| `DataTable` | The workhorse — trips, users, tickets, audit, payouts, dedicated-drivers, **live** |
| `StatCard` | KPI tiles — dashboard, revenue, live counts |
| `Card` · `Button` · `Badge` | Sections, actions, status pills |

## `components/shell/`
`Sidebar` (renders `lib/nav.ts`, permission-filtered) · `Topbar` · `page-header` (exports `PageHeader` + `ComingSoon`).

## RBAC + session
`Can` / `useCan` (`components/can.tsx`) · `SessionProvider` / `useSession` (`components/session-provider.tsx`) · `KariMark` (logo).

## Data fetching
- **Client:** TanStack Query (`lib/query.tsx` `QueryProvider`) calling `adminApi` → the same-origin proxy.
- **Server Components** fetch the backend directly (README → proxy split).

## Design & conventions
- **Dark theme**, Kari brand `#FFFF00`, configured in `tailwind.config.ts` + `globals.css`; ~17px root font.
- Icons: **lucide-react**. **No Mapbox / Recharts** — the live "map" is a `DataTable` and revenue is `StatCard`s
  (the rich map/charts in ARCHITECTURE.md are not built).
- **Server Components by default**; `'use client'` only for interactivity (`Can`, session context, stateful tables).
