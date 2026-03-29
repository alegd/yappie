FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy everything needed for the monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc* ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/

# Install dependencies and build
RUN pnpm install --shamefully-hoist \
    && pnpm --filter @yappie/api exec prisma generate \
    && pnpm --filter @yappie/api exec nest build \
    && cp -r /app/apps/api/node_modules/.prisma /app/node_modules/.prisma

# Non-root user
RUN addgroup -S yappie && adduser -S yappie -G yappie \
    && chown -R yappie:yappie /app

# Entrypoint
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3001
USER yappie

ENTRYPOINT ["/app/docker-entrypoint.sh"]
