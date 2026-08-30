# Yappie E2E Testing — Design

- **Date:** 2026-08-30
- **Status:** Approved (shape), pending spec review
- **Goal:** Give Claude (and later CI) a way to run repeatable, deterministic end-to-end tests of the audio→ticket pipeline, at two levels — API-level and a mobile UI smoke — against an isolated local backend, never production.

## Context & Constraints (discovered)

- No e2e framework exists today: mobile has Jest unit only, API has Vitest unit only.
- Login is **OTP emailed** and stored server-side (`otpService.generateAndStore` → `emailService.sendOtp`). No bypass, no fixed code → an automated test cannot read the email.
- **No test/staging backend:** all three `eas.json` profiles and `.env.local` point at prod (`api.yappie.gueden.com`). Running e2e against prod would pollute real data.
- Mobile stack is Expo 55 canary + RN 0.83 bridgeless. Dev mode surfaces a **masked** `MessageQueue` error; **Release builds boot fine** (see `mobile-expo55-canary` memory and PR #93).
- The AI step (OpenAI transcription + decomposition) is costly and non-deterministic.

## Decisions (locked)

1. **Both levels:** deterministic API e2e base + a thin UI smoke.
2. **Isolated local backend** (docker-compose) as the e2e target — seedable, resettable.
3. **Auth:** a non-prod-only OTP helper endpoint (exercises the real OTP flow, serves both API and UI tests).
4. **AI:** mocked in test mode (deterministic, free).
5. **UI:** Maestro driving the **iOS simulator**.
6. **Prod safety (non-negotiable):** every test hook is off unless an explicit non-prod flag is set, with a hard `NODE_ENV=production` guard.

## Architecture

### Layer 0 — Local e2e backend (foundation)

- `docker-compose` e2e services: Postgres + Redis + API (Nest) in test mode.
- New env flags, Zod-validated in `apps/api/src/config/env.config.ts`, default `false`:
  - `E2E_TEST_ENDPOINTS` — enables the OTP helper route.
  - `E2E_MOCK_AI` — makes `AIService` return canned output.
  - **Hard guard:** if `NODE_ENV === "production"` and either flag is true → throw at boot (fail fast).
- **OTP helper:** `GET /auth/_test/last-otp?email=` → latest stored OTP for that email. Returns 404 when `E2E_TEST_ENDPOINTS` is off; excluded from Swagger.
- **AI mock:** `AIService` returns a deterministic canned decomposition when `E2E_MOCK_AI` is on — no OpenAI call.
- **Reset/seed:** a reset helper (e.g. `prisma migrate reset --force` or a truncate script) plus a minimal e2e seed for clean state between runs.

### Layer 1 — API e2e (deterministic base)

- Location: `apps/api/test/e2e/` — Vitest + supertest, as a separate vitest project so unit runs stay fast.
- Happy-path flow: `POST /auth/request-otp` → `GET /auth/_test/last-otp` → `POST /auth/verify-otp` (obtain JWT) → `POST` audio upload (small fixture) → poll job → assert a ticket is created with the mocked AI output.
- Runs against the booted local stack (true e2e). In-process Nest boot is a fallback to decide in the plan.
- Command: root `pnpm e2e` → `pnpm --filter api test:e2e`.

### Layer 2 — UI smoke (Maestro on iOS)

- Location: `apps/mobile/.maestro/`.
- Local-backend env: `.env.e2e` with `EXPO_PUBLIC_API_URL=http://<mac-LAN-ip>:<port>`; built in **Release** (dev mode is broken on this stack).
- Flow `smoke.yaml`: `launchApp` → tap "Get started" → `inputText` email → `runScript` fetches the OTP from the helper → `inputText` code → `assertVisible` home → tap record → stop → `assertVisible` the generated ticket.
- **Audio is irrelevant** because AI is mocked: the flow exercises the record UI and the backend returns a deterministic ticket regardless of audio content.
- Command: `pnpm --filter mobile e2e:ui` → `maestro test .maestro/smoke.yaml`, with screenshots captured.

## Data flow (API happy path)

`email` → `POST /auth/request-otp` → OTP stored (Redis) → `GET /auth/_test/last-otp` → `POST /auth/verify-otp` → `{ accessToken }` → `POST` audio (fixture) → BullMQ job → `AIService` (mock) → ticket persisted → `GET /tickets` → assert.

## Testing (TDD)

- Backend OTP helper endpoint and AI-mock toggle: written test-first (Vitest, red → green).
- The API e2e suite is itself the integration test.
- The Maestro flow is validated by running it against the local stack and confirming in the simulator (screenshot), never trusting a green build alone.

## Prod safety (non-negotiable)

- `E2E_TEST_ENDPOINTS` and `E2E_MOCK_AI` default `false`; only the local/e2e compose sets them.
- Boot-time Zod refinement throws if either is true under `NODE_ENV=production`.
- OTP helper route 404s when disabled and is excluded from Swagger.

## Out of scope (YAGNI)

- Android UI e2e (iOS only for now).
- Real-AI e2e runs (mock only).
- Full CI wiring (local-first; CI is a follow-up).
- A multi-scenario UI matrix (one happy-path smoke).

## Open items to resolve in the implementation plan

- Reset strategy (`migrate reset` vs targeted truncate) and API-e2e run mode (against docker vs in-process Nest).
- **Element selectors:** the mobile UI likely needs stable `testID`/accessibility labels for Maestro to target (email input, OTP input, record button, ticket row). Adding those is part of the mobile work.
- Reliably injecting the Mac LAN IP into the Maestro build env.
