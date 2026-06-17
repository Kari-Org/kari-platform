# RBAC

The admin authorization model. **Single source of truth: `@kari/types/rbac.ts`** — shared by the backend
guard and the admin console, so a role change is a one-map edit.

## Roles (`AdminRole`, stored on `User.adminRole`)
`SUPER_ADMIN` · `OPS` · `SUPPORT` · `FINANCE` · `READ_ONLY`

## Permissions (20, `resource:action`)
`dashboard:view` · `fleet:view` · `riders:read` · `riders:manage` · `drivers:read` · `drivers:manage` ·
`drivers:verify` · `dedicated:read` · `dedicated:onboard` · `trips:read` · `trips:override` ·
`disputes:manage` · `tickets:read` · `tickets:manage` · `finance:read` · `finance:manage` ·
`admins:read` · `admins:manage` · `audit:read` · `settings:manage`

## Role → permissions (`ROLE_PERMISSIONS`)
- **SUPER_ADMIN** — all 20.
- **OPS** — dashboard, fleet, riders r/manage, drivers r/manage/verify, dedicated r/onboard, trips r/override, disputes, tickets r/manage. *(No finance / admins / audit / settings.)*
- **SUPPORT** — dashboard, fleet, riders:read, drivers:read, trips:read, disputes, tickets r/manage.
- **FINANCE** — dashboard, trips:read, finance r/manage.
- **READ_ONLY** — read-only across dashboard / fleet / riders / drivers / dedicated / trips / tickets / finance / audit.

## Helpers
`hasPermission(role, perm)` · `permissionsFor(role)`.

## Enforcement — four layers, one map
1. **Backend** — `@RequirePermissions('...')` + `PermissionsGuard` on every `/admin/*` route.
2. **Sidebar / routes** — `lib/nav.ts` items each declare a `permission`; the sidebar renders only what's allowed.
3. **Client gating** — `<Can permission="...">` + `useCan(perm)` (`components/can.tsx`) read the session's `adminRole`.
4. **Session** — `SessionProvider` / `useSession` hold the `AdminUser` (incl. `adminRole`), provided by the dash layout from `requireSession()`.

The signed-in admin's role + this map is the whole story; the **Settings page renders the live matrix** of roles × permissions.

> **v2 (not built):** move `ROLE_PERMISSIONS` into a DB table for runtime editing via the *Admins & Roles*
> page (which is currently a `ComingSoon` stub); the `PERMISSIONS` catalog stays code-defined.
