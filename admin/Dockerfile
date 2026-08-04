# Kari admin console (Next.js 15) container image for Railway.
#
# Build from the repository ROOT — this is a pnpm workspace and admin depends on
# the @kari/types workspace package. Set the Railway service's Dockerfile path to
# `admin/Dockerfile` with the build context at the repo root.
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
# Next injects PORT-awareness into server.js; Railway provides PORT.
COPY --from=build /app/admin/.next/standalone ./
COPY --from=build /app/admin/.next/static ./admin/.next/static
COPY --from=build /app/admin/public ./admin/public
EXPOSE 3000
CMD ["node", "admin/server.js"]
