# Running E2E Tests

## API e2e (deterministic, prod-safe)

Prerequisites:

1. `docker compose up -d postgres redis` (from repo root)
2. Create `apps/api/.env.e2e` with the following variables:
   - `NODE_ENV=test`
   - `DB_NAME` — isolated database name (e.g., `yappie_e2e`)
   - `REDIS_URL` — isolated Redis DB (e.g., `redis://localhost:6379/15`)
   - `ENCRYPTION_KEY` — 64-character hex string (generate with `openssl rand -hex 32`)
   - `E2E_TEST_ENDPOINTS=true`
   - `E2E_MOCK_AI=true`
   - All other schema-required variables (see `apps/api/.env.example`)
3. `pnpm --filter api exec prisma migrate deploy` (ensure the e2e DB schema exists)

Run: `pnpm e2e`

What it does: boots the NestJS app in-process against local Postgres/Redis with `E2E_TEST_ENDPOINTS=true` and `E2E_MOCK_AI=true`, registers a user via the real OTP flow (code read from Redis through the guarded endpoint), uploads a fixture audio, lets the in-process BullMQ worker process it with the deterministic FakeAIService, and asserts tickets are created.

**Prod safety:** both flags default to `false` and boot validation fails if either is `true` under `NODE_ENV=production`. The OTP endpoint 404s unless `E2E_TEST_ENDPOINTS=true`.

## Mobile UI smoke (Maestro)

See the follow-up plan (depends on this layer + PR #93 merged).
