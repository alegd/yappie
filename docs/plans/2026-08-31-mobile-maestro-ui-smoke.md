# Mobile Maestro iOS UI Smoke — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single deterministic Maestro smoke test that drives the real iOS app through login → record → generated ticket against an isolated local backend with mocked AI.

**Architecture:** Layer 2 of the e2e design, on top of the merged Layer 0/1 work (PR #94). A guarded seed script puts a known user + project into the `yappie_e2e` database; the API runs as a real network server on the Mac LAN IP with `E2E_TEST_ENDPOINTS`/`E2E_MOCK_AI` on; a Release build of the app points at that LAN URL; Maestro drives the UI and reads the OTP from the non-prod helper endpoint via `runScript`. Stable `testID`s are added to the elements on the happy path because the shared `Button` mutates its visible label to `"<label> — Loading…"` while pending, which makes text matchers flaky.

**Tech Stack:** Maestro 2.1.0, Expo SDK 55 canary + RN 0.83 bridgeless, expo-router, expo-audio 55.0.18, React Query, NestJS 11, Prisma 7, Vitest 4, jest-expo + @testing-library/react-native.

**Spec:** `docs/specs/2026-08-30-mobile-e2e-testing-design.md` (Layer 2)

---

## Global Constraints

- **The agent MUST NOT read, write, or `test` any `.env*` file** — permission-denied. Every `.env` change is handed to the user as a command to run. This plan is designed to need **zero new `.env` files**.
- **Never run a build to "verify" a change.** The one iOS Release build this plan needs is an explicit, isolated, user-gated step (Task 6). No subagent may run `expo run:ios`, `xcodebuild`, or `pnpm build` outside Task 6.
- **NO code comments.** Code must be self-explanatory (project rule). This includes JSX comments. YAML comments in `.maestro/*.yaml` are permitted only where they document a non-obvious Maestro behavior.
- **TDD is mandatory:** write the failing test, run it, watch it fail, then implement. Red → Green → Refactor.
- **Conventional commits**, no AI attribution, no `Co-Authored-By`.
- **Dev mode is broken on this stack.** The app must be built `--configuration Release`; the dev red-box `ReferenceError: Property 'MessageQueue' doesn't exist` is a mask, not the real error.
- **Metro must run on port 8082** for Yappie (8081 is taken by another local app).
- **`apps/mobile` is NOT in the pnpm workspace.** `pnpm-workspace.yaml` excludes it (`!apps/mobile`) and its package is named `yappie`, so **every `pnpm --filter mobile …` command silently matches nothing, exits 0, and runs no tests.** Always run mobile tooling from inside the package: `cd apps/mobile && npx jest <paths> --ci --forceExit`.
- **`--forceExit` is mandatory for jest here.** jest-expo leaves open handles, so jest prints `Jest did not exit one second after the test run has completed` and hangs indefinitely after a green run. Without `--forceExit` a foreground run never returns. **Never** work around a hang by backgrounding the test run — add the flag.
- **Do not upgrade Reanimated or react-native-worklets.** The pair `reanimated@4.2.1` + `worklets@0.7.2` is the only consistent set on Expo SDK 55; bumping either breaks the CocoaPods version assertion.
- **iOS only.** Android UI e2e, real-AI runs, CI wiring, and a multi-scenario matrix are out of scope (spec §Out of scope).
- **Prod safety is non-negotiable:** every helper is gated behind `E2E_TEST_ENDPOINTS` / `E2E_MOCK_AI`, and any destructive DB helper must refuse unless `NODE_ENV=test` AND `DB_NAME` matches `/e2e/i`.
- **`start:e2e` must use `nest start --tsc`, never `tsx`.** `tsx` runs on esbuild, which does not emit `design:paramtypes`, so NestJS type-based DI breaks (`ConfigService` arrives `undefined` in `CryptoService`). The seed script may use `tsx` — it touches only Prisma, no decorators.
- **Killing the e2e server: kill by port, not by job id.** `nest start --tsc` forks a `node dist/main` child, so `pnpm start:e2e & … kill $!` leaves the real server running and the port bound. Use `kill $(lsof -ti tcp:3011)`.

### Verified environment facts (do not re-derive)

| Fact                              | Value                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maestro version                   | 2.1.0 (`/opt/homebrew/bin/maestro`)                                                                                                                                                      |
| Simulator                         | iPhone 17 Pro, iOS 26.5, already booted                                                                                                                                                  |
| iOS bundle id                     | `com.gueden.yappie`                                                                                                                                                                      |
| Mac LAN IP (re-check at run time) | `192.168.1.234`                                                                                                                                                                          |
| API port (e2e)                    | **`3011`** — `.env.e2e` sets `PORT=3011`. `main.ts:53` only defaults to 3001 when `PORT` is unset; the e2e server does NOT listen on 3001. Re-derive it from the boot log, never assume. |
| API global prefix                 | `/api/v1` (`main.ts:32`)                                                                                                                                                                 |
| OTP helper                        | `GET /api/v1/auth/_test/last-otp?email=` → `{ code }`                                                                                                                                    |
| Mocked AI ticket titles           | `Add login button`, `Fix header layout`                                                                                                                                                  |
| Mocked transcription              | `E2E transcription: add a login button and fix the header.`                                                                                                                              |
| Tabs `initialRouteName`           | `projects` (NOT `home`)                                                                                                                                                                  |
| `Input` component                 | already forwards `testID` (extends `TextInputProps`, spreads `...props`) — **no change needed**                                                                                          |
| `Button` component                | does NOT forward `testID` — needs the prop (Task 1)                                                                                                                                      |

### Verified Maestro API (do not guess)

```yaml
- runScript:
    file: script.js
    env:
      MY_NAME: "value"
```

- Inside the JS file, `env` keys are **plain globals** (`MY_NAME`), not `process.env.MY_NAME`.
- `http.get(url, config)` → `{ ok, status, body, headers }`; `body` is a **string**.
- `json(str)` is a global that parses JSON.
- `output.x = value` in JS → referenced in the flow as `${output.x}`.
- `extendedWaitUntil: { visible: <selector>, timeout: <ms> }` (also `notVisible`).
- `clearKeychain` exists and is iOS-specific. It is **required** here: Expo SecureStore stores the auth token in the iOS Keychain, which survives `clearState`.

### Empirically verified on the real simulator (2026-09-19)

- **Text selectors are full-match regex, and React Native merges accessible children.** A `Pressable` with `accessibilityRole="button"` exposes its child `Text` nodes as ONE `accessibilityText`, joined with `", "` — `ListRow` with an empty subtitle renders as `"E2E Project, "`, not `"E2E Project"`. `assertVisible: "E2E Project"` **FAILS**; `assertVisible: "E2E Project.*"` passes. **Every bare text selector in a flow needs a `.*` suffix**, and this bites hardest on `TicketRow`, whose title sits beside priority/status badges. Prefer a `testID` wherever one exists.
- **`pill-tab-home` cannot be grepped out of the bundle** — `pill-tab-bar.tsx:36` builds it as ``testID={`pill-tab-${route.name}`}``, so the literal never appears in `main.jsbundle`. It resolves correctly at runtime; verified with a live `assertVisible`.
- **An iOS "Apple Account Verification" system dialog can sit on top of the app** and swallow taps. It is not the app's, so `clearState` does not clear it. Dismiss it conditionally at the start of the flow with a `runFlow` guarded by `when: visible: "Not Now"`.
- **Socket.IO from the simulator to the LAN backend WORKS** — the server logs `Client connected` and `lsof` shows an ESTABLISHED `Yappie ↔ node` connection on `192.168.1.234:3011`. This was the plan's biggest risk: `audio-detail.tsx` has no polling, so the ticket assert depends entirely on the socket delivering `audio:completed`. It does.
- **Verify what is actually baked into the build** before trusting a run: `rg -o -a "http://192\.168\.[0-9.]+:[0-9]+" "$(xcrun simctl get_app_container booted com.gueden.yappie)/main.jsbundle"`. A Release bundle inlines `EXPO_PUBLIC_API_URL` at build time, so a stale build silently points at the wrong port.

---

## File Structure

**Mobile — testID plumbing (Tasks 1–4)**

| File                                                               | Responsibility                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `apps/mobile/src/components/ui/button.tsx`                         | add optional `testID`, forward to `Pressable`                                  |
| `apps/mobile/src/components/ui/list-row.tsx`                       | add optional `testID`, forward to `Pressable`                                  |
| `apps/mobile/src/features/auth/welcome-screen.tsx`                 | `testID="welcome-get-started"`                                                 |
| `apps/mobile/src/features/auth/email-form.tsx`                     | `testID="email-input"`, `testID="email-submit"`                                |
| `apps/mobile/src/features/auth/otp-form.tsx`                       | `testID="otp-input"`, `testID="otp-submit"`                                    |
| `apps/mobile/src/components/navigation/floating-fab.tsx`           | forward `testID`; FAB gets `testID="record-fab"`                               |
| `apps/mobile/src/components/navigation/floating-record-button.tsx` | pass `testID="record-fab"`                                                     |
| `apps/mobile/src/features/recording/recording-modal.tsx`           | `testID="record-start"`, `testID="record-stop"`, `testID="project-picker-row"` |
| `apps/mobile/src/features/audios/audio-row.tsx`                    | `testID="audio-row"`                                                           |
| `apps/mobile/src/features/audios/audio-detail.tsx`                 | `testID="tickets-header"`                                                      |
| `apps/mobile/src/features/tickets/ticket-row.tsx`                  | `testID="ticket-row"`                                                          |

**API — seed + server (Task 5)**

| File                                            | Responsibility                                           |
| ----------------------------------------------- | -------------------------------------------------------- |
| `apps/api/test/e2e/helpers/seed-ui.ts`          | guarded `seedUiE2e()` — truncate + insert user & project |
| `apps/api/test/e2e/helpers/seed-ui.e2e.spec.ts` | unit tests for the guard and the inserts                 |
| `apps/api/scripts/e2e-seed-ui.ts`               | thin CLI wrapper run via `tsx`                           |
| `apps/api/package.json`                         | `e2e:seed:ui` and `start:e2e` scripts                    |

**Maestro (Task 7)**

| File                                | Responsibility                             |
| ----------------------------------- | ------------------------------------------ |
| `apps/mobile/.maestro/fetch-otp.js` | polls the OTP helper, exposes `output.otp` |
| `apps/mobile/.maestro/smoke.yaml`   | the single happy-path flow                 |
| `apps/mobile/package.json`          | `e2e:ui` script                            |
| `docs/e2e/README.md`                | run instructions for the UI smoke (Task 8) |

---

## Task 1: Forward `testID` through the shared `Button`

**Files:**

- Modify: `apps/mobile/src/components/ui/button.tsx:4-43`
- Test: `apps/mobile/src/components/ui/button.spec.tsx` (create if absent)

**Interfaces:**

- Consumes: nothing.
- Produces: `Button` accepts an optional `testID?: string` forwarded to the root `Pressable`. Tasks 2 and 3 depend on this.

**Context:** `Button` destructures its props explicitly, so `testID` is currently dropped. `Input` already works (`InputProps extends TextInputProps` + `{...props}` onto `TextInput`) — **do not modify `Input`**.

- [ ] **Step 1: Write the failing test**

Create/extend `apps/mobile/src/components/ui/button.spec.tsx`:

```tsx
import { render } from "@testing-library/react-native";
import { Button } from "./button";

describe("Button", () => {
  it("forwards testID to the pressable", () => {
    const { getByTestId } = render(
      <Button label="Continue" onPress={() => {}} testID="email-submit" />,
    );

    expect(getByTestId("email-submit")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd apps/mobile && npx jest src/components/ui/button.spec.tsx --ci --forceExit`
Expected: FAIL — TypeScript rejects the `testID` prop and/or `getByTestId` throws "Unable to find an element with testID: email-submit".

- [ ] **Step 3: Implement**

In `apps/mobile/src/components/ui/button.tsx`, add `testID?: string;` to `ButtonProps`, destructure it, and forward it:

```tsx
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  testID?: string;
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  testID,
}: ButtonProps) {
```

and on the `Pressable`:

```tsx
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={containerStyles}
    >
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd apps/mobile && npx jest src/components/ui/button.spec.tsx --ci --forceExit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui/button.tsx apps/mobile/src/components/ui/button.spec.tsx
git commit -m "feat(mobile): forward testID through the shared Button"
```

---

## Task 2: Add testIDs to the auth happy path

**Files:**

- Modify: `apps/mobile/src/features/auth/welcome-screen.tsx`
- Modify: `apps/mobile/src/features/auth/email-form.tsx`
- Modify: `apps/mobile/src/features/auth/otp-form.tsx`
- Test: the co-located `*.spec.tsx` for each (create if absent)

**Interfaces:**

- Consumes: `Button`'s `testID` prop (Task 1).
- Produces: the selectors `welcome-get-started`, `email-input`, `email-submit`, `otp-input`, `otp-submit`, consumed by the flow in Task 7.

**Context:** the seeded user (Task 5) already exists, so `verify-otp` returns a token directly and the submit button reads `Verify` — the `needsRegister` branch with the "Your name" field is **not** on the smoke path. Add `otp-submit` to the single submit `Button` regardless of which label it renders.

- [ ] **Step 1: Write the failing tests**

In `apps/mobile/src/features/auth/welcome-screen.spec.tsx`:

```tsx
it("exposes a testID on the get started button", () => {
  const { getByTestId } = render(<WelcomeScreen />);

  expect(getByTestId("welcome-get-started")).toBeTruthy();
});
```

In `apps/mobile/src/features/auth/email-form.spec.tsx`:

```tsx
it("exposes testIDs on the email field and submit button", () => {
  const { getByTestId } = render(<EmailForm />);

  expect(getByTestId("email-input")).toBeTruthy();
  expect(getByTestId("email-submit")).toBeTruthy();
});
```

In `apps/mobile/src/features/auth/otp-form.spec.tsx`:

```tsx
it("exposes testIDs on the code field and submit button", () => {
  const { getByTestId } = render(<OtpForm />);

  expect(getByTestId("otp-input")).toBeTruthy();
  expect(getByTestId("otp-submit")).toBeTruthy();
});
```

Match each file's existing render/wrapper setup (providers, router mocks). If a spec file does not exist, mirror the setup of the nearest existing spec in `src/features/auth/`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd apps/mobile && npx jest src/features/auth --ci --forceExit`
Expected: FAIL — "Unable to find an element with testID: ..." for each new assertion.

- [ ] **Step 3: Implement**

- `welcome-screen.tsx`: add `testID="welcome-get-started"` to the `Button` whose label is `Get started`.
- `email-form.tsx`: add `testID="email-input"` to the `Input` with placeholder `you@example.com`; add `testID="email-submit"` to the `Button` labelled `Continue`.
- `otp-form.tsx`: add `testID="otp-input"` to the `Input` with placeholder `1234`; add `testID="otp-submit"` to the submit `Button`. Leave the conditional "Your name" `Input` untouched.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd apps/mobile && npx jest src/features/auth --ci --forceExit`
Expected: PASS, and no previously-passing auth test regresses.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/auth
git commit -m "test(mobile): add stable testIDs to the auth happy path"
```

---

## Task 3: Add testIDs to the record path

**Files:**

- Modify: `apps/mobile/src/components/ui/list-row.tsx`
- Modify: `apps/mobile/src/components/navigation/floating-fab.tsx`
- Modify: `apps/mobile/src/components/navigation/floating-record-button.tsx`
- Modify: `apps/mobile/src/features/recording/recording-modal.tsx`
- Test: `apps/mobile/src/components/ui/list-row.spec.tsx`, `apps/mobile/src/components/navigation/floating-record-button.spec.tsx`, `apps/mobile/src/features/recording/recording-modal.spec.tsx`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: selectors `record-fab`, `project-picker-row`, `record-start`, `record-stop`, consumed by Task 7. `ListRow` gains an optional `testID?: string` forwarded to its root `Pressable`.

**Context:** the FAB is icon-only (`accessibilityLabel="Record audio"`, no text), so a testID is the only robust selector. Tapping the FAB from the Projects tab opens the modal in `selecting_project` (`recording-modal.tsx:62-67`), which renders a `FlatList` of `ListRow`s — with exactly one seeded project, `{ id: "project-picker-row", index: 0 }` is unambiguous.

**Known UI bug — record it, do not fix it here:** in `recording-modal.tsx` the `idle`/`recording`/`uploading` blocks are sibling conditionals **not** gated by `needsPermission`, so when a `projectId` is present and mic permission is denied the screen renders the permission prompt _and_ the `Record` button at the same time. Task 6 sidesteps it by pre-granting the microphone. Note it in the commit body; a real fix is out of scope for this plan.

- [ ] **Step 1: Write the failing tests**

In `apps/mobile/src/components/ui/list-row.spec.tsx`:

```tsx
it("forwards testID to the pressable", () => {
  const { getByTestId } = render(
    <ListRow title="E2E Project" onPress={() => {}} testID="project-picker-row" />,
  );

  expect(getByTestId("project-picker-row")).toBeTruthy();
});
```

In `apps/mobile/src/components/navigation/floating-record-button.spec.tsx`:

```tsx
it("exposes a testID on the record fab", () => {
  const { getByTestId } = render(<FloatingRecordButton />);

  expect(getByTestId("record-fab")).toBeTruthy();
});
```

In `apps/mobile/src/features/recording/recording-modal.spec.tsx`:

```tsx
it("exposes a testID on the start recording button", () => {
  const { getByTestId } = renderRecordingModal({ projectId: "project-1" });

  expect(getByTestId("record-start")).toBeTruthy();
});
```

Reuse each spec's existing render helpers and mocks (`useLocalSearchParams`, `expo-audio`, React Query). Do not invent new mocking infrastructure — mirror what the existing `recording-modal.spec.tsx` already does.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd apps/mobile && npx jest src/components/ui/list-row src/components/navigation/floating-record-button src/features/recording --ci --forceExit`
Expected: FAIL — "Unable to find an element with testID: ..." for each new assertion.

- [ ] **Step 3: Implement**

- `list-row.tsx`: add `testID?: string` to its props interface and forward it to the root `Pressable`.
- `floating-fab.tsx`: add `testID?: string` to its props interface and forward it to the root `Pressable`.
- `floating-record-button.tsx`: pass `testID="record-fab"` to `FloatingFab`.
- `recording-modal.tsx`: add `testID="project-picker-row"` to the `ListRow` inside the `FlatList` `renderItem`; add `testID="record-start"` to the `Pressable` whose `accessibilityLabel` is `Start recording`; add `testID="record-stop"` to the `Pressable` whose `accessibilityLabel` is `Stop recording`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd apps/mobile && npx jest src/components/ui/list-row src/components/navigation/floating-record-button src/features/recording --ci --forceExit`
Expected: PASS with no regressions.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui/list-row.tsx apps/mobile/src/components/navigation apps/mobile/src/features/recording
git commit -m "test(mobile): add stable testIDs to the record path

The idle/recording/uploading blocks in recording-modal.tsx are sibling
conditionals not gated by needsPermission, so a denied-permission screen
also renders the Record button. The UI smoke pre-grants the microphone
to avoid the ambiguity; fixing the conditional is tracked separately."
```

---

## Task 4: Add testIDs to the audio and ticket path

**Files:**

- Modify: `apps/mobile/src/features/audios/audio-row.tsx`
- Modify: `apps/mobile/src/features/audios/audio-detail.tsx:114`
- Modify: `apps/mobile/src/features/tickets/ticket-row.tsx`
- Test: co-located `*.spec.tsx` for each (create if absent)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: selectors `audio-row`, `tickets-header`, `ticket-row`, consumed by Task 7.

**Context:** `fileName` is timestamped (`audio-<epoch>.m4a`), so text matching is unstable — `{ id: "audio-row", index: 0 }` targets the newest row on Home instead. `audio-detail.tsx:114` renders `Tickets ({audio.tickets.length})`; `ticket-row.tsx` already has a `ticket-checkbox` testID but only in multi-select mode, so the row itself needs one.

- [ ] **Step 1: Write the failing tests**

In `apps/mobile/src/features/audios/audio-row.spec.tsx`:

```tsx
it("exposes a testID on the row", () => {
  const { getByTestId } = render(<AudioRow audio={makeAudio()} onPress={() => {}} />);

  expect(getByTestId("audio-row")).toBeTruthy();
});
```

In `apps/mobile/src/features/tickets/ticket-row.spec.tsx`:

```tsx
it("exposes a testID on the row", () => {
  const { getByTestId } = render(<TicketRow ticket={makeTicket()} onPress={() => {}} />);

  expect(getByTestId("ticket-row")).toBeTruthy();
});
```

In `apps/mobile/src/features/audios/audio-detail.spec.tsx`:

```tsx
it("exposes a testID on the tickets header", () => {
  const { getByTestId } = renderAudioDetail({ tickets: [] });

  expect(getByTestId("tickets-header")).toBeTruthy();
});
```

Assert only on presence here. `toHaveTextContent` depends on RNTL's built-in jest matchers being registered in `jest-setup.js`, which is not verified for this repo — a failing matcher would look like a failing feature. The rendered `Tickets (N)` copy is pinned by the Maestro assert in Task 7 instead.

Build `makeAudio()` / `makeTicket()` from the shapes in `apps/mobile/src/lib/api/types.ts`, reusing any existing fixture helpers in those spec files.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd apps/mobile && npx jest src/features/audios src/features/tickets --ci --forceExit`
Expected: FAIL — "Unable to find an element with testID: ..." for each new assertion.

- [ ] **Step 3: Implement**

- `audio-row.tsx`: add `testID="audio-row"` to the root `Pressable`.
- `ticket-row.tsx`: add `testID="ticket-row"` to the root `Pressable`.
- `audio-detail.tsx:114`: add `testID="tickets-header"` to the `Tickets (N)` `Text`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd apps/mobile && npx jest src/features/audios src/features/tickets --ci --forceExit`
Expected: PASS with no regressions.

- [ ] **Step 5: Run the whole mobile suite and commit**

Run: `cd apps/mobile && npx jest --ci --forceExit`
Expected: the full jest suite passes.

```bash
git add apps/mobile/src/features/audios apps/mobile/src/features/tickets
git commit -m "test(mobile): add stable testIDs to the audio and ticket path"
```

---

## Task 5: Guarded e2e UI seed and the e2e API server script

**Files:**

- Create: `apps/api/test/e2e/helpers/seed-ui.ts`
- Create: `apps/api/test/e2e/helpers/seed-ui.e2e.spec.ts`
- Create: `apps/api/scripts/e2e-seed-ui.ts`
- Modify: `apps/api/package.json:5-17`

**Interfaces:**

- Consumes: `PrismaClient` from `@prisma/client`; the safety-guard convention established by `apps/api/test/e2e/helpers/reset.ts`.
- Produces:
  - `export const E2E_UI_EMAIL = "e2e-ui@example.com"`
  - `export const E2E_UI_PROJECT_NAME = "E2E Project"`
  - `export async function seedUiE2e(prisma: PrismaClient): Promise<{ userId: string; projectId: string }>`
  - npm scripts `e2e:seed:ui` and `start:e2e`.

**Context:** the smoke needs a user that already exists (so `verify-otp` returns a token directly and the submit button reads `Verify`, skipping the `complete-register` branch) and at least one project (so `ProjectsList` does **not** `router.replace("/onboarding")`, and so the recorder's project picker has a row to tap). Models are minimal: `User { email, name }`, `Project { name, userId }`.

The guard is a hard requirement: this function truncates. Mirror `reset.ts` exactly — refuse unless `NODE_ENV=test` AND `DB_NAME` matches `/e2e/i`.

The test here uses a **mocked** Prisma client and must not connect to a database. It is named `seed-ui.e2e.spec.ts` deliberately: the shared unit config includes only `src/**/*.spec.ts` (`packages/config/vitest/base.ts`) and `vitest.e2e.config.ts` includes only `test/e2e/**/*.e2e.spec.ts`, so a file named `seed-ui.spec.ts` here would match **neither** pattern and silently never run — unacceptable for a test guarding a `TRUNCATE`. The `.e2e.spec.ts` name puts it in the existing e2e project with no config change, matching the convention that the only specs outside `src/` in `apps/api` are `*.e2e.spec.ts`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/test/e2e/helpers/seed-ui.e2e.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { E2E_UI_EMAIL, E2E_UI_PROJECT_NAME, seedUiE2e } from "./seed-ui.js";

function createMockPrisma() {
  return {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    user: { create: vi.fn().mockResolvedValue({ id: "user-1" }) },
    project: { create: vi.fn().mockResolvedValue({ id: "project-1" }) },
  };
}

describe("seedUiE2e", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DB_NAME", "yappie_e2e");
  });

  it("refuses to run when NODE_ENV is not test", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(seedUiE2e(mockPrisma as never)).rejects.toThrow(/unsafe target/);
    expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("refuses to run when DB_NAME is not an e2e database", async () => {
    vi.stubEnv("DB_NAME", "yappie");

    await expect(seedUiE2e(mockPrisma as never)).rejects.toThrow(/unsafe target/);
    expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("truncates users and seeds the ui user with one project", async () => {
    const result = await seedUiE2e(mockPrisma as never);

    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: E2E_UI_EMAIL, name: "E2E UI User" },
    });
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: { name: E2E_UI_PROJECT_NAME, userId: "user-1" },
    });
    expect(result).toEqual({ userId: "user-1", projectId: "project-1" });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm --filter api exec vitest run --config vitest.e2e.config.ts test/e2e/helpers/seed-ui.e2e.spec.ts`
Expected: FAIL — cannot resolve `./seed-ui.js`.

- [ ] **Step 3: Implement the seed helper**

Create `apps/api/test/e2e/helpers/seed-ui.ts`:

```ts
import type { PrismaClient } from "@prisma/client";

export const E2E_UI_EMAIL = "e2e-ui@example.com";
export const E2E_UI_USER_NAME = "E2E UI User";
export const E2E_UI_PROJECT_NAME = "E2E Project";

export async function seedUiE2e(
  prisma: PrismaClient,
): Promise<{ userId: string; projectId: string }> {
  if (process.env.NODE_ENV !== "test" || !/e2e/i.test(process.env.DB_NAME ?? "")) {
    throw new Error(
      `seedUiE2e refused: unsafe target (NODE_ENV=${process.env.NODE_ENV}, DB_NAME=${process.env.DB_NAME}). Expected NODE_ENV=test and an e2e database.`,
    );
  }
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  const user = await prisma.user.create({
    data: { email: E2E_UI_EMAIL, name: E2E_UI_USER_NAME },
  });
  const project = await prisma.project.create({
    data: { name: E2E_UI_PROJECT_NAME, userId: user.id },
  });
  return { userId: user.id, projectId: project.id };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm --filter api exec vitest run --config vitest.e2e.config.ts test/e2e/helpers/seed-ui.e2e.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the CLI wrapper and the scripts**

Create `apps/api/scripts/e2e-seed-ui.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { seedUiE2e } from "../test/e2e/helpers/seed-ui.js";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await seedUiE2e(prisma);
    console.log(`seeded e2e ui fixtures: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

In `apps/api/package.json`, add to `scripts`:

```json
    "e2e:seed:ui": "dotenv -e .env.e2e -- tsx scripts/e2e-seed-ui.ts",
    "start:e2e": "dotenv -e .env.e2e -- tsx src/main.ts",
```

`start:e2e` boots the real Nest HTTP server (unlike the in-process `createE2eApp` used by the API e2e suite). Nest's `app.listen(port)` binds `0.0.0.0`, so the simulator can reach it over the LAN.

- [ ] **Step 6: Verify the seed and the server against the live e2e stack**

```bash
docker compose up -d postgres redis
pnpm --filter api e2e:seed:ui
```

Expected: `seeded e2e ui fixtures: {"userId":"...","projectId":"..."}`.

Then, in a second shell:

```bash
pnpm --filter api start:e2e
```

and from a third shell confirm the server answers on the LAN address and that the guarded helper is enabled:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.1.234:3011/health
curl -s -X POST http://192.168.1.234:3011/api/v1/auth/request-otp \
  -H 'Content-Type: application/json' -d '{"email":"e2e-ui@example.com"}'
curl -s 'http://192.168.1.234:3011/api/v1/auth/_test/last-otp?email=e2e-ui@example.com'
```

Expected: `200`, then a 201 from `request-otp`, then `{"code":"NNNN"}` — a 4-digit code. If `last-otp` returns 404, `E2E_TEST_ENDPOINTS` is not `true` in `.env.e2e`; **stop and hand the fix to the user** (the agent must not touch `.env*`).

- [ ] **Step 7: Commit**

```bash
git add apps/api/test/e2e/helpers/seed-ui.ts apps/api/test/e2e/helpers/seed-ui.e2e.spec.ts apps/api/scripts/e2e-seed-ui.ts apps/api/package.json
git commit -m "test(api): add guarded e2e ui seed and networked e2e server script"
```

---

## Task 6: Provision the simulator and build the app against the LAN backend

**Files:** none (environment provisioning only — no source changes, no commit).

**Interfaces:**

- Consumes: `start:e2e` and `e2e:seed:ui` (Task 5); the testIDs from Tasks 1–4 must already be in the working tree so they are compiled into the Release bundle.
- Produces: a Release build of `com.gueden.yappie` installed on the booted simulator, pointed at `http://<LAN_IP>:3011`, with microphone permission pre-granted.

**⚠️ This is the only task permitted to run a build.** It is user-gated: present the commands and let the user run or approve them. Do not silently invoke `expo run:ios`.

- [ ] **Step 1: Confirm the LAN IP and the simulator**

```bash
ipconfig getifaddr en0
xcrun simctl list devices booted
```

Expected: an IP on the local network, and a booted device. If the IP differs from `192.168.1.234`, use the real value everywhere below and in Task 7.

- [ ] **Step 2: Pre-grant the microphone**

```bash
xcrun simctl privacy booted grant microphone com.gueden.yappie
```

This avoids the iOS permission prompt entirely. It also sidesteps the `recording-modal.tsx` conditional bug noted in Task 3, where a denied state renders the permission prompt and the `Record` button simultaneously.

- [ ] **Step 3: Build and install in Release with the LAN API URL**

The API URL is injected as a shell environment variable rather than a `.env` file: Expo only auto-loads `.env`, `.env.local`, `.env.development`, and `.env.production`, so a `.env.e2e` would be ignored — and the agent is not permitted to create `.env*` files anyway. `EXPO_PUBLIC_*` vars are inlined into the bundle at build time by Metro.

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=http://192.168.1.234:3011 RCT_METRO_PORT=8082 \
  npx expo run:ios --configuration Release --device "iPhone 17 Pro"
```

Expected: the build succeeds and the app launches on the simulator. Because this is a Release build, the bundle is embedded — no Metro server is needed at run time.

- [ ] **Step 4: Verify the app booted and reached the LAN backend**

```bash
xcrun simctl launch booted com.gueden.yappie
xcrun simctl io booted screenshot /tmp/yappie-boot.png
```

Then read `/tmp/yappie-boot.png` and confirm the welcome screen with `Get started` is visible — **never trust a green build alone**. If the app crashes on launch, the Release bundle shows the real error (dev mode masks it as `MessageQueue doesn't exist`).

- [ ] **Step 5: Verify the Socket.IO connection reaches the LAN backend — this is the biggest risk in the plan**

`audio-detail.tsx` has **no polling**: `useQuery` there declares no `refetchInterval`. Fresh data arrives only via the Socket.IO `audio:completed` event (`src/lib/socket.ts:21-33`), which invalidates `queryKeys.audio(audioId)`. `refetchOnWindowFocus: true` is set in `query-client.ts` but React Native needs a `focusManager` + AppState bridge that this repo does not wire up. **If the socket does not connect from the simulator to the LAN backend, the ticket assert in Task 7 can never pass.**

With the API running (`start:e2e`), tail its logs while the app is in the foreground and confirm a websocket connection is established from the simulator. If no connection appears:

- Confirm `src/lib/socket.ts` builds its URL from `env.apiUrl` (the LAN address), not a hardcoded host.
- Note that the client uses `transports: ["websocket"]` only — there is no polling fallback.
- **Stop and report before writing the flow.** The fallback is to make the smoke assert on a screen that refetches on mount instead, or to wire `focusManager`; either changes Task 7 and needs a decision, not an improvised workaround.

---

## Task 7: Write the Maestro smoke flow

**Files:**

- Create: `apps/mobile/.maestro/fetch-otp.js`
- Create: `apps/mobile/.maestro/smoke.yaml`
- Modify: `apps/mobile/package.json` (scripts)

**Interfaces:**

- Consumes: every testID from Tasks 1–4; `E2E_UI_EMAIL` (`e2e-ui@example.com`) and `E2E_UI_PROJECT_NAME` (`E2E Project`) from Task 5; the provisioned simulator from Task 6.
- Produces: `cd apps/mobile && npm run e2e:ui`.

**Context — the exact flow, derived from the real code:**

1. After `verify-otp`, `otp-form.tsx` calls `router.replace("/(tabs)")` and the tabs group's `initialRouteName` is `projects`, so the app lands on **Projects**, not Home. The seeded project keeps `ProjectsList` from redirecting to `/onboarding`.
2. The FAB from the Projects tab passes **no** `projectId`, so the modal opens in `selecting_project` showing the header `Choose a project`.
3. After upload the modal calls `router.dismiss()`, returning to Projects.
4. `pill-tab-home` is a pre-existing testID on the Home tab.
5. `clearKeychain` is required — Expo SecureStore keeps the token in the iOS Keychain, which survives `clearState`.

- [ ] **Step 1: Write the OTP fetch script**

Create `apps/mobile/.maestro/fetch-otp.js`:

```js
function fetchOtp() {
  for (var attempt = 0; attempt < 20; attempt++) {
    var response = http.get(API_URL + "/api/v1/auth/_test/last-otp?email=" + EMAIL);
    if (response.ok) {
      return json(response.body).code;
    }
  }
  throw new Error("OTP not available at " + API_URL + " for " + EMAIL);
}

output.otp = fetchOtp();
```

`API_URL` and `EMAIL` are injected by the flow's `runScript.env` block and are available as plain globals — not `process.env`. The retry loop covers the race between tapping `Continue` (which fires `POST /auth/request-otp`) and the OTP landing in Redis.

- [ ] **Step 2: Write the flow**

Create `apps/mobile/.maestro/smoke.yaml`:

```yaml
appId: com.gueden.yappie
env:
  API_URL: http://192.168.1.234:3011
  EMAIL: e2e-ui@example.com
  PROJECT_NAME: E2E Project
---
- clearKeychain
- launchApp:
    clearState: true

- runFlow:
    when:
      visible: "Not Now"
    commands:
      - tapOn: "Not Now"

- assertVisible: "Get started.*"
- tapOn:
    id: "welcome-get-started"

- tapOn:
    id: "email-input"
- inputText: ${EMAIL}
- tapOn:
    id: "email-submit"

- assertVisible: "Enter code.*"
- runScript:
    file: fetch-otp.js
    env:
      API_URL: ${API_URL}
      EMAIL: ${EMAIL}
- tapOn:
    id: "otp-input"
- inputText: ${output.otp}
- tapOn:
    id: "otp-submit"

- extendedWaitUntil:
    visible: "${PROJECT_NAME}.*"
    timeout: 25000

- tapOn:
    id: "record-fab"
- assertVisible: "Choose a project.*"
- tapOn:
    id: "project-picker-row"
    index: 0

- extendedWaitUntil:
    visible:
      id: "record-start"
    timeout: 10000
- tapOn:
    id: "record-start"
- extendedWaitUntil:
    visible:
      id: "record-stop"
    timeout: 10000
- tapOn:
    id: "record-stop"

- extendedWaitUntil:
    notVisible:
      id: "record-stop"
    timeout: 60000

- tapOn:
    id: "pill-tab-home"
- extendedWaitUntil:
    visible:
      id: "audio-row"
    timeout: 20000
- tapOn:
    id: "audio-row"
    index: 0

- extendedWaitUntil:
    visible:
      id: "ticket-row"
    timeout: 90000
- assertVisible:
    id: "tickets-header"
    text: "Tickets \(2\).*"
- assertVisible: "Add login button.*"
- assertVisible: "Fix header layout.*"
- takeScreenshot: smoke-ticket-generated
```

The final assert is layered on purpose: waiting on `ticket-row` is text-independent, so the timeout covers pipeline latency without coupling to copy. `Tickets (2)`, `Add login button`, and `Fix header layout` then pin the exact output of `FakeAIService.decompose` — two tickets with those precise titles — which proves the whole upload → BullMQ → mocked-AI → persistence chain ran, not merely that some screen rendered. If the LAN IP from Task 6 Step 1 differs, update `API_URL` here.

- [ ] **Step 3: Add the run script**

In `apps/mobile/package.json`, add to `scripts`:

```json
    "e2e:ui": "maestro test .maestro/smoke.yaml"
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/.maestro apps/mobile/package.json
git commit -m "test(mobile): add Maestro iOS UI smoke for the audio-to-ticket flow"
```

---

## Task 8: Run the smoke end to end, verify visually, and document it

**Files:**

- Modify: `docs/e2e/README.md`

**Interfaces:**

- Consumes: everything from Tasks 1–7.
- Produces: a passing smoke run with a screenshot, and run instructions.

- [ ] **Step 1: Bring up the full stack**

```bash
docker compose up -d postgres redis
pnpm --filter api e2e:seed:ui
pnpm --filter api start:e2e
```

Keep `start:e2e` running in its own shell.

- [ ] **Step 2: Run the smoke**

```bash
cd apps/mobile && npm run e2e:ui
```

Expected: every step passes and `smoke-ticket-generated.png` is written.

- [ ] **Step 3: Verify visually — do not trust a green run alone**

```bash
xcrun simctl io booted screenshot /tmp/yappie-smoke-final.png
```

Read both `smoke-ticket-generated.png` and `/tmp/yappie-smoke-final.png` and confirm the audio detail screen shows `Tickets (2)` with `Add login button` and `Fix header layout`.

- [ ] **Step 4: Confirm the run is repeatable**

Re-run `pnpm --filter api e2e:seed:ui` then `cd apps/mobile && npm run e2e:ui` a second time. Expected: passes again from a clean seed. A failure here means state leaked — most likely the Keychain (check `clearKeychain` ran) or a stale audio row.

If a step is flaky, fix it by tightening a selector or extending an `extendedWaitUntil` timeout — **never** by inserting blind waits to paper over a race.

- [ ] **Step 5: Document and commit**

Extend `docs/e2e/README.md` with a "Mobile UI smoke (Maestro, iOS)" section covering: the prerequisites (Maestro, booted simulator, docker stack), the seed step, `start:e2e`, the LAN-IP Release build command from Task 6 Step 3, the `simctl privacy` grant, and `cd apps/mobile && npm run e2e:ui`. Call out explicitly that the API URL is injected as a shell variable rather than a `.env` file, and that a Release build is mandatory on this stack.

```bash
git add docs/e2e/README.md
git commit -m "docs(e2e): add mobile UI smoke run instructions"
```

- [ ] **Step 6: Finish the branch**

Use superpowers:finishing-a-development-branch. Push and open a PR against `main`.

---

## Deferred / follow-ups (do not do in this plan)

- Fix the `recording-modal.tsx` conditional so `needsPermission` gates the `idle`/`recording`/`uploading` blocks.
- Wire a React Query `focusManager` + AppState bridge so `refetchOnWindowFocus` actually works on React Native.

`recording-modal.tsx` error handling itself is no longer deferred: commits
`9cfea59`, `cd164aa`, and `08488d1` implemented it mid-execution (user
explicitly authorized this) — `handleStartRecording` now catches
`prepareToRecordAsync`/`record` failures, enables the iOS audio session
before recording, and pairs `allowsRecording` with `playsInSilentMode` to
avoid the native "Impossible audio mode" throw.

- Carried over from PR #94: create `apps/api/.env.e2e.example`; add `E2E_TEST_ENDPOINTS=false` / `E2E_MOCK_AI=false` to `.env.example`; fix the `ENCRYPTION_KEY` Zod `.min(32)` (chars) vs `CryptoService` needing 64 hex.
- Android UI e2e, real-AI e2e runs, CI wiring, multi-scenario UI matrix (spec §Out of scope).
