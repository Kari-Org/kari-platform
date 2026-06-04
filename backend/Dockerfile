# Multi-stage build for the backend within the pnpm monorepo.
# NOTE: starting point — not yet exercised in CI.
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

# Install with workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile

# Build shared types, then the backend.
COPY . .
RUN pnpm --filter @kari/types build && pnpm --filter @kari/backend build

# Produce a self-contained prod bundle for the backend.
RUN pnpm --filter @kari/backend deploy --prod /app

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "dist/main.js"]
