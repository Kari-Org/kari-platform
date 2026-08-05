# Kari backend container image (the ONLY backend Dockerfile).
#
# Build from the repository ROOT — this is a pnpm workspace and the backend
# depends on the @kari/types workspace package, so it cannot be built from
# backend/ in isolation. Railway picks this Dockerfile via the backend service's
# RAILWAY_DOCKERFILE_PATH (default ./Dockerfile); root changes redeploy it via
# railway.json build.watchPatterns.
#
# Node is pinned to 22.13.1 to match .nvmrc / EAS / engines (pnpm 11.5.1 needs
# Node >= 22.13). Keep this version in lockstep with CI and the app builds.

# ---- build ----------------------------------------------------------------
FROM node:22.13.1-slim AS build
WORKDIR /app
ENV CI=1
# Install pnpm directly (not via corepack): corepack bundled with pinned Node
# patch releases ships stale package-signing keys and fails `corepack prepare`
# with "Cannot find matching keyid". A direct npm global install is deterministic.
RUN npm i -g pnpm@11.5.1

# Whole workspace (the .dockerignore keeps node_modules/dist/.env out).
COPY . .

# Install only the backend + its workspace deps — skips the heavy Expo/RN app deps.
RUN pnpm install --frozen-lockfile --filter @kari/backend...
# Shared types must be built before the backend can compile against them.
RUN pnpm --filter @kari/types build && pnpm --filter @kari/backend build

# ---- runtime --------------------------------------------------------------
FROM node:22.13.1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Carry the installed workspace across: node_modules (with the @kari/types
# symlink), the built backend dist, and packages/types/dist. Migrations run on
# boot (synchronize is off in prod), so the compiled migrations ship here too.
COPY --from=build /app ./
WORKDIR /app/backend
# Informational only — Railway injects PORT and the app binds config.port (3000 default).
EXPOSE 3000
CMD ["node", "dist/main.js"]
