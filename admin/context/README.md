# Admin Console Context

Detailed, code-verified reference for the **Kari admin console** (`admin/`). A **Next.js 15 App Router** app —
a different stack from the mobile apps. Complements the repo-wide `context/` system.

> **Authority: code is ground truth.** `ARCHITECTURE.md` was moved here and reconciled — notably its
> **Auth.js / Mapbox / Recharts** claims, **none of which are built**.

## Files
[ARCHITECTURE.md](ARCHITECTURE.md) · [page-catalog.md](page-catalog.md) · [rbac.md](rbac.md) · [ui-registry.md](ui-registry.md)

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript.** Tailwind CSS **3** (not v4) + a small **local
  shadcn-style `ui/` kit** (no external shadcn/Radix dep). **TanStack Query** (client data),
  **socket.io-client** (present), **lucide-react** icons. **No `next-auth`, Mapbox, or Recharts** despite ARCHITECTURE.md.
- Shares **`@kari/types`** for the **RBAC contract** — the one piece truly shared with the backend.

## Auth — custom httpOnly cookie (NOT Auth.js)
- **Login:** `app/api/admin/login/route.ts` POSTs email/password to backend `/auth/login`; if
  `user.role === 'ADMIN'`, stores the **access token in an httpOnly cookie** (`ADMIN_COOKIE`; sameSite lax,
  12h, secure in prod). Returns `{ user }`.
- **Session:** `lib/auth.ts` `getSession()` reads the cookie + validates against backend `GET /auth/me`
  (must be `role === 'ADMIN'`). `requireSession()` is the Server-Component guard (→ `/login`).
- **Middleware** (`middleware.ts`): a **cookie-presence** gate only (no cookie → `/login`; cookie on `/login`
  → `/dashboard`). Real validation is server-side in `getSession`.
- **No refresh token** on the admin side — the cookie holds a 12h access token; the admin re-logs-in after. Zoho SSO is **not** wired.

## The same-origin proxy + server/client fetch split
- **`lib/api.ts` `apiFetch<T>`** unwraps the `ApiResponse<T>` envelope and routes by environment:
  - **Browser → `/api/proxy/<path>`** (same-origin; the httpOnly cookie rides along automatically).
  - **Server Component → `env.apiBaseUrl` directly.**
- **`app/api/proxy/[...path]/route.ts`** forwards every method to `${apiBaseUrl}/<path>` with the cookie's
  token attached as **Bearer** — so the JWT never touches client JS.
- **`lib/admin-api.ts` `adminApi`** is the typed surface over `/admin/*`: `stats · users · user · rides ·
  fleet · setUserStatus · verifyDriver · cancelRide · audit · drivers · createDedicated · tickets ·
  updateTicket · financeSummary · payouts · fareConfig`. Row/response types are defined **locally** (not in `@kari/types`).

## Shell & RBAC
- **`app/(dash)/layout.tsx`** (Server Component): `requireSession()` → `<SessionProvider user>` →
  `<QueryProvider>` → `Sidebar` + `Topbar` + `<main>`.
- **RBAC** is enforced four ways off the one `@kari/types` map — see [rbac.md](rbac.md).
