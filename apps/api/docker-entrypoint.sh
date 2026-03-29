#!/bin/sh
set -e

# Build DATABASE_URL from individual env vars
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
export DATABASE_URL

# Generate prisma.config.js for Prisma 7 (requires config file, tsx not available in runtime)
cat > prisma.config.js << EOF
const path = require("node:path");
module.exports = {
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: { url: process.env.DATABASE_URL },
  migrate: { url: process.env.DATABASE_URL },
};
EOF

echo "[entrypoint] Running database migrations..."
npx --no-install prisma migrate deploy --config ./prisma.config.js

echo "[entrypoint] Starting API..."
exec node dist/main
