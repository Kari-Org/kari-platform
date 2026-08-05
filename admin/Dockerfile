# Kari admin console (Next.js 15) container image for Railway.
#
# Build from the repository ROOT — this is a pnpm workspace and admin depends on
# the @kari/types workspace package. The admin Railway service selects this file
# via `admin/railway.json` (build.dockerfilePath); build context is the repo root
# (the service's root directory is `/`).
#
# Uses Next.js standalone output (next.config.ts: output:'standalone' +
# outputFileTracingRoot at the repo root). The traced layout is:
#   .next/standalone/admin/server.js   (entrypoint)
#   .next/standalone/node_modules       (traced deps)
# with static assets and public/ copied in beside it.

# ---- build ----------------------------------------------------------------
FROM node:22.13.1-slim AS build
WORKDIR /app
ENV CI=1
# Direct pnpm install — corepack in pinned Node patches fails signature checks.
RUN npm i -g pnpm@11.5.1

COPY . .
# Install admin + its workspace deps only (skips the backend/Expo app deps).
RUN pnpm install --frozen-lockfile --filter @kari/admin...
# Shared types must be built before Next compiles against them.
RUN pnpm --filter @kari/types build && pnpm --filter @kari/admin build

# ---- runtime --------------------------------------------------------------
FROM node:22.13.1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Next standalone binds to process.env.HOSTNAME (Docker sets it to the container
# ID), so without this it listens only on the container's own IP and Railway's
# router gets "service unavailable". Force all-interfaces binding.
ENV HOSTNAME=0.0.0.0
# Next injects PORT-awareness into server.js; Railway provides PORT.
COPY --from=build /app/admin/.next/standalone ./
COPY --from=build /app/admin/.next/static ./admin/.next/static
COPY --from=build /app/admin/public ./admin/public
EXPOSE 3000
CMD ["node", "admin/server.js"]
