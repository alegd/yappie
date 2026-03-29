#!/bin/sh
set -e

# Build DATABASE_URL from individual env vars
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
export DATABASE_URL

# Generate prisma.config.mjs for Prisma 7 (ESM format, no tsx needed)
cat > prisma.config.mjs << 'PRISMA_CONFIG'
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, "prisma", "schema.prisma"),
  datasource: { url: process.env.DATABASE_URL },
  migrate: { url: process.env.DATABASE_URL },
});
PRISMA_CONFIG

echo "[entrypoint] Running database migrations..."
npx --no-install prisma migrate deploy --config ./prisma.config.mjs

echo "[entrypoint] Starting API..."
exec node dist/main
