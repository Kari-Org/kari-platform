# @kari/backend

Unified NestJS backend for the Kari platform. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full
design, module catalog, and requirements traceability.

## Run locally

```bash
# from repo root
docker compose up -d
cp backend/.env.example backend/.env
pnpm --filter @kari/backend dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @kari/backend dev` | Watch-mode dev server |
| `pnpm --filter @kari/backend build` | Compile to `dist/` |
| `pnpm --filter @kari/backend test` | Unit tests |
| `pnpm --filter @kari/backend lint` | Lint |
| `pnpm --filter @kari/backend migration:generate` | Generate a TypeORM migration |
| `pnpm --filter @kari/backend migration:run` | Apply migrations |

## Phase 0 status

Foundation only. In place: config (Zod-validated), Postgres (TypeORM), Redis, BullMQ,
authenticated Socket.IO gateway (Redis adapter), global validation + error envelope + pino logging,
JWT guards/decorators, provider abstraction (no-op impls), Swagger, Docker Compose, CI.

Feature modules (auth flows, rides, payments, …) are built in later phases per the architecture doc.
