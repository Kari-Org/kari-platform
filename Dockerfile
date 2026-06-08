# Kari backend container image.
#
# IMPORTANT: build from the repository ROOT (this is a pnpm workspace — the
# backend depends on the @kari/types workspace package, so it cannot be built
# from backend/ in isolation). Railway uses railway.json -> dockerfilePath.

# ---- build ----------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app
ENV CI=1
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

# Copy the whole workspace (the .dockerignore keeps node_modules/dist/.env out).
COPY . .

# Install only the backend + its workspace deps — skips the Expo/RN app deps.
RUN pnpm install --frozen-lockfile --filter @kari/backend...
# Build the shared types package first, then the backend.
RUN pnpm --filter @kari/types build && pnpm --filter @kari/backend build

# ---- runtime --------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Carry the installed workspace across: node_modules (with the @kari/types
# symlink), the built backend dist, and packages/types/dist.
COPY --from=build /app ./
WORKDIR /app/backend
EXPOSE 5001
CMD ["node", "dist/main.js"]
