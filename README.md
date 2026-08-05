# Kari Platform

Monorepo for the Kari ride-sharing platform (Nigeria). One language end-to-end (TypeScript),
shared types, one place to build and ship.

## Layout

| Path                    | What                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `backend/`              | NestJS unified backend ([architecture](backend/ARCHITECTURE.md))   |
| `web/`                  | Next.js single-page marketing site (light theme)                   |
| `admin/`                | Next.js 15 operations console (dark theme, RBAC)                   |
| `driver/`               | Driver mobile app — Expo/React Native                              |
| `rider/`                | Rider mobile app — Expo/React Native                               |
| `packages/types/`       | `@kari/types` — shared enums + API contracts + RBAC                |
| `packages/mobile-core/` | `@kari/mobile-core` — shared mobile UI, API client, socket, tokens |
| `brand/`                | Logo, icons, fonts, design assets                                  |

## Context system (read before building)

Durable decisions and build state live in [`context/`](context/) — AI agents read these before writing
code; [`AGENTS.md`](AGENTS.md) is the agent front door.

| File                                                         | Job                                                                   | Read when                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------- |
| [`context/foundation.md`](context/foundation.md)             | **Authority** — every locked decision + reasoning; wins all conflicts | every session                         |
| [`context/project-overview.md`](context/project-overview.md) | plain-English product story                                           | orienting                             |
| [`context/architecture.md`](context/architecture.md)         | stack, boundaries, data model, ride-type matrix                       | touching any app                      |
| [`context/code-standards.md`](context/code-standards.md)     | implementation law                                                    | before writing code                   |
| [`context/library-docs.md`](context/library-docs.md)         | how each library is used _here_ + approved deps                       | adding/using a dependency             |
| [`context/design-tokens.md`](context/design-tokens.md)       | colors, fonts, theming invariants                                     | building UI                           |
| [`context/provider-docs.md`](context/provider-docs.md)       | the 10 external-provider contracts                                    | touching an integration               |
| [`context/build-graph.md`](context/build-graph.md)           | what depends on what; what's buildable next                           | planning work                         |
| [`context/progress-log.md`](context/progress-log.md)         | what's actually built (newest first)                                  | every session, and **after** any work |
| [`context/debug-guide.md`](context/debug-guide.md)           | diagnosis patterns + known non-bugs                                   | something's broken                    |

**Golden rule:** when a decision changes, update `foundation.md` first, then ripple it into every file
that references it — two files must never disagree. Per-product deep dives live in each app's own
`context/` folder (`backend/context/`, `rider/context/`, …).

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

- API: http://localhost:3000 · Health: `/health` · Docs: `/docs`

## Common commands

```bash
pnpm build        # build every package (turbo, respects deps)
pnpm lint         # lint all
pnpm test         # test all
pnpm typecheck    # typecheck all
```
