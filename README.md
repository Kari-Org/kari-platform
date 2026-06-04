# Kari Platform

Monorepo for the Kari ride-sharing platform (Nigeria). One language end-to-end (TypeScript),
shared types, one place to build and ship.

## Layout

| Path | What |
|------|------|
| `backend/` | NestJS unified backend ([architecture](backend/ARCHITECTURE.md)) |
| `web/` | Next.js marketing/web app *(to be scaffolded)* |
| `admin/` | Admin dashboard *(to be scaffolded)* |
| `driver/` | Driver mobile app — Expo/React Native *(to be scaffolded)* |
| `rider/` | Rider mobile app — Expo/React Native *(to be scaffolded)* |
| `packages/types/` | `@kari/types` — shared enums + API contracts |

## Prerequisites

- Node 24 (`.nvmrc`)
- pnpm (via `corepack`)
- Docker (for local Postgres + Redis)

## Getting started

```bash
pnpm install              # install all workspaces
docker compose up -d      # start Postgres + Redis
cp backend/.env.example backend/.env
pnpm --filter @kari/backend dev
```

- API: http://localhost:3000  ·  Health: `/health`  ·  Docs: `/docs`

## Common commands

```bash
pnpm build        # build every package (turbo, respects deps)
pnpm lint         # lint all
pnpm test         # test all
pnpm typecheck    # typecheck all
```
