# ── Stage 1: deps ─────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc* ./

# Copy package.json for each workspace package
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/

# Install all dependencies (devDeps needed for build stage)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: build ────────────────────────────────────
FROM deps AS build

# Copy source code
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/

# Build the API (prisma generate + nest build)
RUN pnpm --filter @yappie/api build

# Prune devDependencies after build
RUN pnpm prune --prod --no-optional

# ── Stage 3: runtime ──────────────────────────────────
FROM node:22-alpine AS runtime

RUN addgroup -S yappie && adduser -S yappie -G yappie

WORKDIR /app

# Copy node_modules from build stage (pruned to prod only)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled application
COPY --from=build /app/apps/api/dist ./dist

# Copy Prisma schema + migrations (for migrate deploy)
COPY --from=build /app/apps/api/prisma ./prisma

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Ensure yappie user can write (prisma migrate + config generation)
RUN chown -R yappie:yappie /app

EXPOSE 3001

USER yappie

ENTRYPOINT ["./docker-entrypoint.sh"]
