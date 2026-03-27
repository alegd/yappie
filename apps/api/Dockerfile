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
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────
FROM deps AS build

# Copy source code
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/

# Build the API (prisma generate + nest build)
RUN pnpm --filter @yappie/api build

# Create isolated production deployment
RUN pnpm deploy --prod --filter @yappie/api /app/deploy

# ── Stage 3: runtime ──────────────────────────────────
FROM node:22-alpine AS runtime

RUN addgroup -S yappie && adduser -S yappie -G yappie

WORKDIR /app

# Copy production node_modules from pnpm deploy
COPY --from=build /app/deploy/node_modules ./node_modules

# Copy generated Prisma client from build stage
COPY --from=build /app/apps/api/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application
COPY --from=build /app/apps/api/dist ./dist

# Copy Prisma schema + migrations (for migrate deploy)
COPY --from=build /app/apps/api/prisma ./prisma

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

USER yappie

ENTRYPOINT ["./docker-entrypoint.sh"]
