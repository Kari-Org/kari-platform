# Kari backend container image (the ONLY backend Dockerfile).
#
# Build from the repository ROOT — this is a pnpm workspace and the backend
# depends on the @kari/types workspace package, so it cannot be built from
# backend/ in isolation. The backend Railway service selects this file via
# `backend/railway.json` (build.dockerfilePath: "Dockerfile"); root changes
# redeploy it via that file's build.watchPatterns.
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

# Install the backend + its workspace deps, then build shared types and backend.
RUN pnpm install --frozen-lockfile --filter @kari/backend...
RUN pnpm --filter @kari/types build && pnpm --filter @kari/backend build

# Produce a lean, self-contained production bundle: the backend's built dist plus
# ONLY its production dependencies (with @kari/types resolved). This is what keeps
# the runtime image small — without it, copying the whole workspace ships the
# entire monorepo's node_modules (Next.js, React Native, Expo, dev tooling) and
# the image balloons to ~1.7GB. --legacy is required by this repo's hoisted linker.
RUN pnpm --filter @kari/backend deploy --prod --legacy /prod

# ---- runtime --------------------------------------------------------------
FROM node:22.13.1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only the production bundle: dist/ (incl. compiled migrations, which run on boot
# since synchronize is off in prod) + prod node_modules. No source, no dev deps.
COPY --from=build /prod ./
# Informational only — Railway injects PORT and the app binds config.port (3000 default).
EXPOSE 3000
CMD ["node", "dist/main.js"]
