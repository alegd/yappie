#!/bin/sh
set -e

# Build DATABASE_URL from individual env vars (matches prisma.config.ts convention)
# Prisma 7 with no url in schema.prisma falls back to DATABASE_URL env var
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
export DATABASE_URL

echo "[entrypoint] Running database migrations..."
npx --no-install prisma migrate deploy --schema ./prisma/schema.prisma

echo "[entrypoint] Starting API..."
exec node dist/main
