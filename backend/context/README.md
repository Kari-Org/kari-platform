# Backend Context

Detailed, code-verified reference for the **Kari backend** (`backend/`). This complements the repo-wide
`context/` system — read that first for cross-cutting rules — and goes deep on backend specifics.

> **Authority:** the **code is ground truth**. The detailed files here were extracted from the source
> (`*.controller.ts`, `*.entity.ts`, `*.module.ts`). `ARCHITECTURE.md` (design rationale + lineage) was moved
> into this folder and **reconciled with the code** on 2026-06-08 — where it once diverged (Argon2id,
> two-tier services, per-resource socket rooms) it now matches.

## Files
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — design rationale, legacy lineage (Java + NestJS → unified), principles, requirements traceability, and the phase decisions log. Reconciled with code.
- **[module-catalog.md](module-catalog.md)** — every module: responsibility, routes, entities owned, exports, dependencies.
- **[entity-relationships.md](entity-relationships.md)** — the entity graph, FKs, real relations, version columns.
- **[api-inventory.md](api-inventory.md)** — every HTTP route, with method, auth, and purpose.

---

## Backend at a glance
- **NestJS 11 on Node 24**, TypeScript strict. ~25 modules in `app.module.ts` (18 domain + 7 infra).
- **PostgreSQL 16 + TypeORM** (29 entities), **Redis 7** (geo, quotes, BullMQ, socket adapter), **Socket.IO 4**.
- Bootstrap (`main.ts`): helmet, CORS, global `ValidationPipe`, `RedisIoAdapter` for sockets, Swagger at `/docs`.

## The global request pipeline (every request)
Wired in `app.module.ts` as `APP_*` providers — applies to **all** routes:

| Stage | Provider | Effect |
|------|----------|--------|
| Guard | **`JwtAuthGuard`** (`APP_GUARD`) | **Global** — every route requires a valid JWT **unless** marked `@Public()`. (Not per-route; `@Public` is the opt-out.) |
| Guard | **`ThrottlerGuard`** (`APP_GUARD`) | Global rate limiting |
| Guard (per-controller) | `RolesGuard` via `@UseGuards` + `@Roles(...)` | Role gate (RIDER / DRIVER / ADMIN) |
| Guard (admin only) | `PermissionsGuard` + `@RequirePermissions(...)` | RBAC permission gate, reads `ROLE_PERMISSIONS` |
| Pipe | global `ValidationPipe` ({ whitelist, transform }) | DTO validation via class-validator |
| Interceptor | **`ResponseEnvelopeInterceptor`** (`APP_INTERCEPTOR`) | Wraps every success in the `ApiResponse<T>` envelope (success/message/data/timestamp/traceId) |
| Filter | **`AllExceptionsFilter`** (`APP_FILTER`) | Normalizes every error to the same envelope |

So controllers/services return **raw data** — the interceptor adds the envelope; they throw **Nest
exceptions** — the filter formats them. Don't hand-build the envelope.

## Module conventions (as-built)
- Services split **by concern** (e.g. `money/` → `wallet`/`ledger`/`payments`/`commission`), **not** a two-tier orchestration/data split. A service owns both its logic and its DB access.
- Multi-write ops use a `QueryRunner` transaction inline (canonical: `LedgerService.post`).
- A module shares logic by **exporting its service** and another module **importing the module** (see module-catalog dependencies).
- Entities are registered per-module via `TypeOrmModule.forFeature([...])`; a few modules register *other* modules' entities **read-only** (e.g. `admin` reads `Ride`/profiles/`Transaction`).
