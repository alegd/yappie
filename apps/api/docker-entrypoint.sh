#!/bin/sh

# Build DATABASE_URL from individual env vars
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
export DATABASE_URL

echo "[entrypoint] Running database migrations..."
pnpm exec prisma migrate deploy || echo "[entrypoint] WARNING: migrations failed"

echo "[entrypoint] Starting API..."
node dist/main || {
  echo "[entrypoint] API failed to start. Keeping container alive for debugging..."
  tail -f /dev/null
}
