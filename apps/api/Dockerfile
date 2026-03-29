# ── Stage 1: build ────────────────────────────────────
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc* ./

# Copy package.json for each workspace package
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/

# Install all dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/

# Build the API (prisma generate + nest build)
RUN pnpm --filter @yappie/api build

# ── Stage 2: runtime ──────────────────────────────────
FROM node:22-alpine AS runtime

RUN addgroup -S yappie && adduser -S yappie -G yappie

WORKDIR /app

# Copy everything needed from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Ensure yappie user can write (prisma migrate + config generation)
RUN chown -R yappie:yappie /app

EXPOSE 3001

USER yappie

ENTRYPOINT ["./docker-entrypoint.sh"]
