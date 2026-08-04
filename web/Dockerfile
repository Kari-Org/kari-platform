# Kari marketing site (Next.js 15) container image for Railway.
#
# Build from the repository ROOT — this is a pnpm workspace and web depends on
# the @kari/types workspace package. Set the Railway service's Dockerfile path to
# `web/Dockerfile` with the build context at the repo root.
#
# Uses Next.js standalone output (next.config.ts: output:'standalone' +
# outputFileTracingRoot at the repo root). Entrypoint: .next/standalone/web/server.js.

# ---- build ----------------------------------------------------------------
FROM node:22.13.1-slim AS build
WORKDIR /app
ENV CI=1
# Direct pnpm install — corepack in pinned Node patches fails signature checks.
RUN npm i -g pnpm@11.5.1

COPY . .
# Install web + its workspace deps only.
RUN pnpm install --frozen-lockfile --filter @kari/web...
RUN pnpm --filter @kari/types build && pnpm --filter @kari/web build

# ---- runtime --------------------------------------------------------------
FROM node:22.13.1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Bind all interfaces — Next standalone otherwise binds to Docker's container-ID
# HOSTNAME and Railway can't reach it ("service unavailable").
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/web/.next/standalone ./
COPY --from=build /app/web/.next/static ./web/.next/static
COPY --from=build /app/web/public ./web/public
EXPOSE 3000
CMD ["node", "web/server.js"]
