# API E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Claude (and CI) a deterministic, prod-safe API-level e2e test that exercises the full auth→audio→AI→ticket pipeline against a local backend.

**Architecture:** Boot the real NestJS app in-process (`Test.createTestingModule([AppModule])`) against a real local Postgres + Redis, with the BullMQ audio worker running in-process. Two prod-safe flags gate test-only behavior: `E2E_TEST_ENDPOINTS` exposes an OTP-retrieval endpoint, `E2E_MOCK_AI` swaps `AIService` for a deterministic fake. Supertest drives HTTP.

**Tech Stack:** NestJS 11, Vitest 4, supertest, Prisma 7 (PrismaPg), ioredis, BullMQ, class-validator. ESM with NodeNext — **all relative imports use the `.js` extension**.

**Spec:** `docs/specs/2026-08-30-mobile-e2e-testing-design.md`

## Global Constraints

- **ESM imports:** every relative import ends in `.js` (e.g. `from "./fake-ai.service.js"`).
- **Prod safety:** `E2E_TEST_ENDPOINTS` and `E2E_MOCK_AI` default `false`; validation MUST fail if either is `true` while `NODE_ENV=production`.
- **Global prefix:** all app routes are under `api/v1` except `health`, `api/docs`, `api/docs-json`.
- **JWT:** access-token payload is `{ sub: userId, email }`, signed with `JWT_SECRET`.
- **Commits:** conventional commits; **no AI attribution / no Co-Authored-By**. Work on branch `feature/e2e-testing`.
- **No comments in source** (project rule) — code must be self-explanatory.
- **Redis DI token:** `REDIS_CLIENT` from `../redis/redis.constants.js` (mirror `src/auth/otp.service.ts`). OTP is stored at Redis key `otp:${email}` as JSON `{ code, attempts, verified? }`, TTL 600s.

---

### Task 1: E2E env flags + production hard-guard

**Files:**

- Modify: `apps/api/src/config/env.config.ts`
- Test: `apps/api/src/config/env.config.spec.ts` (create)

**Interfaces:**

- Produces: `envSchema` gains `E2E_TEST_ENDPOINTS: boolean` and `E2E_MOCK_AI: boolean` (parsed from `"true"`/`"false"`). New exported pure fn `e2eFlagsSafe(input: { NODE_ENV: string; E2E_TEST_ENDPOINTS: boolean; E2E_MOCK_AI: boolean }): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/config/env.config.spec.ts
import { z } from "zod";
import { e2eFlagsSafe } from "./env.config.js";

const boolFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

describe("e2e env flags", () => {
  it("parses 'true'/'false' env strings into booleans", () => {
    const schema = z.object({ E2E_MOCK_AI: boolFromEnv });
    expect(schema.parse({ E2E_MOCK_AI: "true" }).E2E_MOCK_AI).toBe(true);
    expect(schema.parse({}).E2E_MOCK_AI).toBe(false);
  });

  it("e2eFlagsSafe is false when a flag is on under production", () => {
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: true, E2E_MOCK_AI: false }),
    ).toBe(false);
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: false, E2E_MOCK_AI: true }),
    ).toBe(false);
  });

  it("e2eFlagsSafe is true when flags are on outside production", () => {
    expect(e2eFlagsSafe({ NODE_ENV: "test", E2E_TEST_ENDPOINTS: true, E2E_MOCK_AI: true })).toBe(
      true,
    );
  });

  it("e2eFlagsSafe is true when flags are off in production", () => {
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: false, E2E_MOCK_AI: false }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec vitest run src/config/env.config.spec.ts`
Expected: FAIL — `e2eFlagsSafe` is not exported.

- [ ] **Step 3: Write minimal implementation**

In `apps/api/src/config/env.config.ts`, add near the top (after imports):

```ts
const boolFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

export function e2eFlagsSafe(input: {
  NODE_ENV: string;
  E2E_TEST_ENDPOINTS: boolean;
  E2E_MOCK_AI: boolean;
}): boolean {
  return !(input.NODE_ENV === "production" && (input.E2E_TEST_ENDPOINTS || input.E2E_MOCK_AI));
}
```

Add these two fields inside the `envSchema` `z.object({ ... })`:

```ts
    E2E_TEST_ENDPOINTS: boolFromEnv,
    E2E_MOCK_AI: boolFromEnv,
```

Append a refinement to `envSchema` (chain `.superRefine` on the object, keeping `export const envSchema = z.object({...}).superRefine(...)`):

```ts
  .superRefine((env, ctx) => {
    if (!e2eFlagsSafe(env)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "E2E_TEST_ENDPOINTS and E2E_MOCK_AI must be false when NODE_ENV=production",
      });
    }
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api exec vitest run src/config/env.config.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/config/env.config.ts apps/api/src/config/env.config.spec.ts
git commit -m "feat(api): add prod-guarded E2E env flags"
```

---

### Task 2: Deterministic FakeAIService

**Files:**

- Create: `apps/api/src/ai/fake-ai.service.ts`
- Test: `apps/api/src/ai/fake-ai.service.spec.ts`

**Interfaces:**

- Produces: `class FakeAIService` with the exact public shape of `AIService`:
  - `transcribe(audioBuffer: Buffer, fileName: string): Promise<{ text: string; duration: number }>`
  - `decompose(transcription: string, projectContext?: string): Promise<Array<{ title: string; description: string }>>`
  - `generateTickets(tasks: Array<{ title: string; description: string }>, projectContext?: string): Promise<Array<{ title: string; description: string; priority: string; sourceQuote?: string }>>`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/ai/fake-ai.service.spec.ts
import { FakeAIService } from "./fake-ai.service.js";

describe("FakeAIService", () => {
  const svc = new FakeAIService();

  it("transcribe returns deterministic text and duration", async () => {
    const r = await svc.transcribe(Buffer.from(""), "x.wav");
    expect(r.text).toContain("login");
    expect(r.duration).toBe(5);
  });

  it("decompose returns a non-empty deterministic task list", async () => {
    const tasks = await svc.decompose("anything");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].title).toBe("Add login button");
  });

  it("generateTickets maps tasks to tickets with a valid priority", async () => {
    const tickets = await svc.generateTickets([{ title: "T", description: "D" }]);
    expect(tickets[0]).toMatchObject({ title: "T", description: "D", priority: "MEDIUM" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec vitest run src/ai/fake-ai.service.spec.ts`
Expected: FAIL — module `./fake-ai.service.js` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/api/src/ai/fake-ai.service.ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class FakeAIService {
  async transcribe(
    _audioBuffer: Buffer,
    _fileName: string,
  ): Promise<{ text: string; duration: number }> {
    return { text: "E2E transcription: add a login button and fix the header.", duration: 5 };
  }

  async decompose(
    _transcription: string,
    _projectContext?: string,
  ): Promise<Array<{ title: string; description: string }>> {
    return [
      { title: "Add login button", description: "Add a login button to the header." },
      { title: "Fix header layout", description: "Correct the spacing in the header." },
    ];
  }

  async generateTickets(
    tasks: Array<{ title: string; description: string }>,
    _projectContext?: string,
  ): Promise<
    Array<{ title: string; description: string; priority: string; sourceQuote?: string }>
  > {
    return tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: "MEDIUM",
      sourceQuote: "E2E",
    }));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api exec vitest run src/ai/fake-ai.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/ai/fake-ai.service.ts apps/api/src/ai/fake-ai.service.spec.ts
git commit -m "feat(api): add deterministic FakeAIService for e2e"
```

---

### Task 3: Wire the AI provider swap behind E2E_MOCK_AI

**Files:**

- Modify: `apps/api/src/ai/ai.module.ts`
- Test: `apps/api/src/ai/ai.module.spec.ts` (create)

**Interfaces:**

- Consumes: `FakeAIService` (Task 2), existing `AIService`, `OPENAI_CLIENT` token.
- Produces: resolving `AIService` from `AIModule` yields a `FakeAIService` instance when `process.env.E2E_MOCK_AI === "true"`, else the real `AIService`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/ai/ai.module.spec.ts
import { Test } from "@nestjs/testing";
import { AIModule } from "./ai.module.js";
import { AIService } from "./ai.service.js";
import { FakeAIService } from "./fake-ai.service.js";

describe("AIModule provider swap", () => {
  const prev = process.env.E2E_MOCK_AI;
  afterEach(() => {
    process.env.E2E_MOCK_AI = prev;
  });

  it("provides FakeAIService for the AIService token when E2E_MOCK_AI=true", async () => {
    process.env.E2E_MOCK_AI = "true";
    const moduleRef = await Test.createTestingModule({ imports: [AIModule] }).compile();
    expect(moduleRef.get(AIService)).toBeInstanceOf(FakeAIService);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec vitest run src/ai/ai.module.spec.ts`
Expected: FAIL — `moduleRef.get(AIService)` is the real `AIService`, not `FakeAIService`.

- [ ] **Step 3: Write minimal implementation**

In `apps/api/src/ai/ai.module.ts`:

1. Import the fake: `import { FakeAIService } from "./fake-ai.service.js";`
2. Make the `OPENAI_CLIENT` factory tolerate a missing key so boot never fails under mock:

```ts
    {
      provide: OPENAI_CLIENT,
      useFactory: () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "e2e-placeholder" }),
    },
```

3. Replace the bare `AIService` provider entry with a conditional class binding:

```ts
    {
      provide: AIService,
      useClass: process.env.E2E_MOCK_AI === "true" ? FakeAIService : AIService,
    },
```

Keep `exports: [AIService]` unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api exec vitest run src/ai/ai.module.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/ai/ai.module.ts apps/api/src/ai/ai.module.spec.ts
git commit -m "feat(api): swap AIService for FakeAIService under E2E_MOCK_AI"
```

---

### Task 4: Guarded OTP-retrieval endpoint

**Files:**

- Create: `apps/api/src/auth/e2e-otp.controller.ts`
- Modify: `apps/api/src/auth/auth.module.ts` (add controller to `controllers: [...]`)
- Test: `apps/api/src/auth/e2e-otp.controller.spec.ts`

**Interfaces:**

- Produces: `GET /api/v1/auth/_test/last-otp?email=<email>` → `{ code: string }` when `E2E_TEST_ENDPOINTS=true` and a code exists; `404` otherwise (flag off, missing email, or no stored code). Route is `@Public()` and `@ApiExcludeController()`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/auth/e2e-otp.controller.spec.ts
import { NotFoundException } from "@nestjs/common";
import { E2eOtpController } from "./e2e-otp.controller.js";

function makeRedis(value: string | null) {
  return { get: async (_key: string) => value } as never;
}

describe("E2eOtpController", () => {
  const prev = process.env.E2E_TEST_ENDPOINTS;
  afterEach(() => {
    process.env.E2E_TEST_ENDPOINTS = prev;
  });

  it("404s when the flag is off", async () => {
    process.env.E2E_TEST_ENDPOINTS = "false";
    const c = new E2eOtpController(makeRedis(JSON.stringify({ code: "1234", attempts: 0 })));
    await expect(c.lastOtp("a@b.com")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns the code when flag on and a code exists", async () => {
    process.env.E2E_TEST_ENDPOINTS = "true";
    const c = new E2eOtpController(makeRedis(JSON.stringify({ code: "1234", attempts: 0 })));
    await expect(c.lastOtp("a@b.com")).resolves.toEqual({ code: "1234" });
  });

  it("404s when flag on but no code stored", async () => {
    process.env.E2E_TEST_ENDPOINTS = "true";
    const c = new E2eOtpController(makeRedis(null));
    await expect(c.lastOtp("a@b.com")).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec vitest run src/auth/e2e-otp.controller.spec.ts`
Expected: FAIL — module `./e2e-otp.controller.js` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/api/src/auth/e2e-otp.controller.ts
import { Controller, Get, Inject, NotFoundException, Query } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants.js";
import { Public } from "./decorators/public.decorator.js";

@ApiExcludeController()
@Controller("auth/_test")
export class E2eOtpController {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  @Public()
  @Get("last-otp")
  async lastOtp(@Query("email") email?: string): Promise<{ code: string }> {
    if (process.env.E2E_TEST_ENDPOINTS !== "true" || !email) {
      throw new NotFoundException();
    }
    const raw = await this.redis.get(`otp:${email}`);
    if (!raw) {
      throw new NotFoundException();
    }
    const { code } = JSON.parse(raw) as { code: string };
    return { code };
  }
}
```

In `apps/api/src/auth/auth.module.ts`: import `E2eOtpController` and add it to the module's `controllers` array (alongside `AuthController`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api exec vitest run src/auth/e2e-otp.controller.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/e2e-otp.controller.ts apps/api/src/auth/e2e-otp.controller.spec.ts apps/api/src/auth/auth.module.ts
git commit -m "feat(api): add guarded e2e OTP-retrieval endpoint"
```

---

### Task 5: E2E harness (deps, config, bootstrap, reset) + boot smoke

**Files:**

- Modify: `apps/api/package.json` (add devDeps + `test:e2e` script)
- Create: `apps/api/vitest.e2e.config.ts`
- Create: `apps/api/test/e2e/helpers/app.ts`
- Create: `apps/api/test/e2e/helpers/reset.ts`
- Create: `apps/api/test/e2e/helpers/wav.ts`
- Create: `apps/api/.env.e2e.example`
- Create: `apps/api/test/e2e/boot.e2e.spec.ts`

**Interfaces:**

- Produces:
  - `createE2eApp(): Promise<{ app: INestApplication; http: import("http").Server }>` — boots `AppModule` with the same global prefix + `ValidationPipe` as `main.ts`.
  - `resetE2e(app: INestApplication): Promise<void>` — truncates the DB (via Prisma) and flushes Redis.
  - `makeWav(): Buffer` — a minimal valid WAV buffer.

**Prerequisites:** local Postgres + Redis running (`docker compose up -d postgres redis` from repo root) and `apps/api/.env.e2e` present (copy from `.env.e2e.example`). The e2e run loads `.env.e2e`.

- [ ] **Step 1: Add devDependencies and script**

Run:

```bash
pnpm --filter api add -D supertest @types/supertest dotenv-cli
```

In `apps/api/package.json` `scripts`, add:

```json
    "test:e2e": "dotenv -e .env.e2e -- vitest run --config vitest.e2e.config.ts"
```

- [ ] **Step 2: Create the e2e Vitest config**

```ts
// apps/api/vitest.e2e.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/e2e/**/*.e2e.spec.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

- [ ] **Step 3: Create the env template**

```bash
# apps/api/.env.e2e.example — copy to apps/api/.env.e2e and adjust to your local stack
NODE_ENV=test
PORT=3011
DB_HOST=localhost
DB_PORT=54320
DB_USER=yappie
DB_PASSWORD=yappie
DB_NAME=yappie
REDIS_URL=redis://localhost:6379
JWT_SECRET=e2e-jwt-secret-e2e-jwt-secret-32chars
ENCRYPTION_KEY=e2e-encryption-key-e2e-encryption-key
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./.e2e-uploads
QUOTA_FREE_MINUTES=60
OPENAI_API_KEY=e2e-placeholder
AI_TRANSCRIPTION_MODEL=whisper-1
AI_DECOMPOSITION_MODEL=gpt-4o-mini
AI_GENERATION_MODEL=gpt-4o-mini
E2E_TEST_ENDPOINTS=true
E2E_MOCK_AI=true
```

(If any additional required var surfaces at boot, the failing test in Step 7 will name it — add it here.)

- [ ] **Step 4: Create the app bootstrap helper**

```ts
// apps/api/test/e2e/helpers/app.ts
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "http";
import { AppModule } from "../../../src/app.module.js";

export async function createE2eApp(): Promise<{ app: INestApplication; http: Server }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1", { exclude: ["api/docs", "api/docs-json", "health"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return { app, http: app.getHttpServer() as Server };
}
```

- [ ] **Step 5: Create the reset helper**

```ts
// apps/api/test/e2e/helpers/reset.ts
import { INestApplication } from "@nestjs/common";
import type { Redis } from "ioredis";
import { PrismaService } from "../../../src/prisma/prisma.service.js";
import { REDIS_CLIENT } from "../../../src/redis/redis.constants.js";

export async function resetE2e(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const redis = app.get<Redis>(REDIS_CLIENT);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  await redis.flushdb();
}
```

- [ ] **Step 6: Create the WAV fixture helper**

```ts
// apps/api/test/e2e/helpers/wav.ts
export function makeWav(): Buffer {
  const sampleRate = 8000;
  const data = Buffer.alloc(320); // 40ms of silence, 16-bit mono
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
```

- [ ] **Step 7: Write the boot smoke test**

```ts
// apps/api/test/e2e/boot.e2e.spec.ts
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";

describe("e2e boot", () => {
  let app: INestApplication;
  let http: Server;

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("boots and enforces auth on a protected route", async () => {
    await request(http).get("/api/v1/tickets").expect(401);
  });
});
```

- [ ] **Step 8: Run the smoke to verify green**

Run (from repo root, Postgres+Redis up, `.env.e2e` present):

```bash
pnpm --filter api test:e2e
```

Expected: PASS — the app boots against real Postgres/Redis and returns 401 for an unauthenticated request. If boot fails naming a missing env var, add it to `.env.e2e` and re-run.

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml apps/api/vitest.e2e.config.ts apps/api/test/e2e apps/api/.env.e2e.example
git commit -m "test(api): add e2e harness (bootstrap, reset, config)"
```

---

### Task 6: Full pipeline e2e (auth → upload → worker → ticket)

**Files:**

- Create: `apps/api/test/e2e/pipeline.e2e.spec.ts`

**Interfaces:**

- Consumes: `createE2eApp`, `resetE2e` (Task 5), `makeWav` (Task 5), the OTP endpoint (Task 4), `FakeAIService` output (Task 2).

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/test/e2e/pipeline.e2e.spec.ts
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";
import { makeWav } from "./helpers/wav.js";

const EMAIL = "e2e-user@example.com";

async function poll<T>(
  fn: () => Promise<T | undefined>,
  timeoutMs = 20000,
  intervalMs = 500,
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value !== undefined) return value;
    if (Date.now() - start > timeoutMs) throw new Error("poll timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe("audio → ticket pipeline", () => {
  let app: INestApplication;
  let http: Server;

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers, uploads audio, and produces tickets from the mocked AI", async () => {
    await request(http).post("/api/v1/auth/request-otp").send({ email: EMAIL }).expect(201);

    const { body: otp } = await request(http)
      .get("/api/v1/auth/_test/last-otp")
      .query({ email: EMAIL })
      .expect(200);
    expect(otp.code).toMatch(/^\d{4}$/);

    await request(http)
      .post("/api/v1/auth/verify-otp")
      .send({ email: EMAIL, code: otp.code })
      .expect(200);

    const { body: registered } = await request(http)
      .post("/api/v1/auth/complete-register")
      .send({ email: EMAIL, code: otp.code, name: "E2E User" })
      .expect(201);
    const token = registered.accessToken as string;
    expect(token).toBeTruthy();

    const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);

    const { body: project } = await auth(
      request(http).post("/api/v1/projects").send({ name: "E2E Project" }),
    ).expect(201);

    const { body: recording } = await auth(
      request(http)
        .post("/api/v1/audio/upload")
        .query({ projectId: project.id })
        .attach("file", makeWav(), { filename: "e2e.wav", contentType: "audio/wav" }),
    ).expect(201);
    expect(recording.id).toBeTruthy();

    await poll(async () => {
      const { body } = await auth(request(http).get(`/api/v1/audio/${recording.id}`)).expect(200);
      return body.status === "COMPLETED" ? body : undefined;
    });

    const { body: tickets } = await auth(
      request(http).get("/api/v1/tickets").query({ projectId: project.id }),
    ).expect(200);
    expect(tickets.total).toBeGreaterThanOrEqual(1);
    expect(tickets.data.map((t: { title: string }) => t.title)).toContain("Add login button");
  });
});
```

- [ ] **Step 2: Run to verify it fails, then passes**

Run: `pnpm --filter api test:e2e`
Expected first: the pipeline test drives the real flow. If it fails, read the failing HTTP status/body and fix the cause (common: a status-code expectation like `verify-otp`/`upload` returning 200 vs 201 — adjust the `.expect()` to the observed code; a missing env var — add to `.env.e2e`). Iterate until:
Expected final: PASS — a ticket titled "Add login button" exists for the project.

- [ ] **Step 3: Commit**

```bash
git add apps/api/test/e2e/pipeline.e2e.spec.ts
git commit -m "test(api): full auth-to-ticket e2e pipeline"
```

---

### Task 7: Root script + run docs

**Files:**

- Modify: root `package.json` (add `e2e` script)
- Create: `docs/e2e/README.md`

- [ ] **Step 1: Add the root script**

In root `package.json` `scripts`, add:

```json
    "e2e": "pnpm --filter api test:e2e"
```

- [ ] **Step 2: Write the run docs**

```markdown
<!-- docs/e2e/README.md -->

# Running E2E Tests

## API e2e (deterministic, prod-safe)

Prerequisites:

1. `docker compose up -d postgres redis` (from repo root)
2. `cp apps/api/.env.e2e.example apps/api/.env.e2e`
3. `pnpm --filter api exec prisma migrate deploy` (ensure the e2e DB schema exists)

Run: `pnpm e2e`

What it does: boots the NestJS app in-process against local Postgres/Redis with `E2E_TEST_ENDPOINTS=true` and `E2E_MOCK_AI=true`, registers a user via the real OTP flow (code read from Redis through the guarded endpoint), uploads a fixture audio, lets the in-process BullMQ worker process it with the deterministic FakeAIService, and asserts tickets are created.

**Prod safety:** both flags default to `false` and boot validation fails if either is `true` under `NODE_ENV=production`. The OTP endpoint 404s unless `E2E_TEST_ENDPOINTS=true`.

## Mobile UI smoke (Maestro)

See the follow-up plan (depends on this layer + PR #93 merged).
```

- [ ] **Step 3: Commit**

```bash
git add package.json docs/e2e/README.md
git commit -m "docs(e2e): add run instructions and root e2e script"
```

---

## Self-Review

**Spec coverage:**

- Layer 0 local backend → Tasks 1 (flags/guard), 3 (AI swap), 4 (OTP endpoint), 5 (reset helper + env template). Docker itself is reused (existing `docker-compose.yaml`), documented in Task 7. ✅
- Layer 1 API e2e → Tasks 5 (harness) + 6 (pipeline). ✅
- Auth via non-prod OTP helper → Task 4 + used in Task 6. ✅
- AI mocked in test mode → Tasks 2 + 3. ✅
- Prod safety hard-guard → Task 1 (`e2eFlagsSafe` + superRefine) and Task 4 (endpoint 404 when off). ✅
- Layer 2 (Maestro) is intentionally a **separate follow-up plan** (noted in Task 7). ✅

**Placeholder scan:** No TBD/TODO. The one iteration note (Task 6 Step 2 / Task 5 Step 8) is explicit guidance to match observed HTTP status codes and env-var boot errors — real, actionable, not a placeholder.

**Type consistency:** `FakeAIService` method signatures (Task 2) match `AIService` (transcribe/decompose/generateTickets) verbatim from the interface reference. `createE2eApp`/`resetE2e`/`makeWav` names are consistent between Task 5 (definition) and Task 6 (use). `REDIS_CLIENT` import path is consistent across Tasks 4 and 5.

**Known residual risks (resolve during implementation, not placeholders):**

- Exact success status codes for `verify-otp` (`@HttpCode(200)`) vs `complete-register`/`upload`/`projects` (default 201) — the pipeline test asserts the documented codes; adjust to observed if Nest differs.
- `TRUNCATE "users" ... CASCADE` assumes all user-owned tables cascade from `users`; verified for `projects`/`tickets` in the schema. If a table without a cascading FK retains rows, extend the truncate list.
