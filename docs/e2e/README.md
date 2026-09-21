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

## Mobile UI smoke (Maestro, iOS)

End-to-end UI smoke test that drives a real Release build against a locally
booted simulator: register via OTP, record audio, run the pipeline, and
assert generated tickets render.

### Prerequisites

- [Maestro](https://maestro.mobile.dev) installed (`maestro --version`).
- A booted iOS simulator with the app already installed (this flow does not
  build — see below).
- Docker running for Postgres/Redis.

### 1. Start dependencies and seed

```
docker compose up -d postgres redis
pnpm --filter @yappie/api run e2e:seed:ui
pnpm --filter @yappie/api run start:e2e
```

`start:e2e` boots the API in the foreground — leave it running in its own
terminal. Kill it later **by port**, not by job control:

```
kill $(lsof -ti tcp:3011)
```

`nest start` forks a child process, so the `$!` PID from backgrounding the
`pnpm` command does not track the actual listener — killing that PID leaves
the API running on 3011.

### 2. Grant microphone access

```
xcrun simctl privacy booted grant microphone com.gueden.yappie
```

### 3. Build once (Release only — dev mode is broken on this stack)

The API URL is injected as a **shell variable at build time**, not read from
a `.env` file — Expo only auto-loads `.env`, `.env.local`, `.env.development`,
and `.env.production`, and none of those are part of this flow.

```
cd apps/mobile && EXPO_PUBLIC_API_URL=http://<LAN_IP>:3011 RCT_METRO_PORT=8082 npx expo run:ios --configuration Release --device "iPhone 17 Pro"
```

Replace `<LAN_IP>` with the machine's LAN IP (`ipconfig getifaddr en0`), not
`localhost` — the simulator's network namespace does not resolve the host's
`localhost` to the Mac. This step is only needed when the installed build is
stale; the smoke run itself does not rebuild the app.

### 4. Run the flow

```
cd apps/mobile && npm run e2e:ui
```

`apps/mobile` is not part of the pnpm workspace, so it is invoked with `npm`,
not `pnpm --filter`.

Expect every step to report `COMPLETED` and a `smoke-ticket-generated.png`
screenshot to be written to `apps/mobile/`.

### Gotchas (each one cost real debugging time)

- **Port 3011, not 3001.** The e2e API listens on the port set by `PORT` in
  `.env.e2e` (3011), not the default dev port. `smoke.yaml`'s `API_URL` and
  the build's `EXPO_PUBLIC_API_URL` must both point at `:3011` or OTP fetch
  and every API call in the flow fail.
- **Release build is mandatory.** Dev mode (Metro/JS bundler) is broken on
  this stack for this flow — always build with `--configuration Release`.
- **Kill by port, not by PID.** `nest start` forks a child; `kill $!` after
  backgrounding the `pnpm` command kills the wrong process and leaves 3011
  bound. Use `kill $(lsof -ti tcp:3011)`.
- **OTP rate limit.** `/auth/request-otp` is throttled
  (`@Throttle({ short: { ttl: 60000, limit: 5 } })`), and throttler storage is
  in-memory per API process. Two smoke runs inside the same 60-second window
  hit a 429 and the flow fails at `"Enter code"`. This is expected — wait out
  the window or restart the API; do not touch the throttle config.
- **Maestro text selectors are full-match regex.** React Native merges an
  element's accessible children with `", "`, so a bare text selector can fail
  to match text that visually looks identical. Bare text selectors generally
  need a `.*` suffix; prefer asserting on a `testID` when one exists, since
  it does not have this problem.
