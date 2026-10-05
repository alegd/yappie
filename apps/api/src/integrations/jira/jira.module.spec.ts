import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommonModule } from "../../common/common.module.js";
import { CryptoModule } from "../../crypto/crypto.module.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { FakeJiraService } from "./fake-jira.service.js";
import { JiraModule } from "./jira.module.js";
import { JiraService } from "./jira.service.js";

const ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

async function compileJiraModule() {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PrismaModule,
      CryptoModule,
      CommonModule,
      JiraModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
}

describe("JiraModule provider swap", () => {
  const prev = process.env.E2E_MOCK_JIRA;

  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (prev === undefined) {
      delete process.env.E2E_MOCK_JIRA;
    } else {
      process.env.E2E_MOCK_JIRA = prev;
    }
  });

  it("provides FakeJiraService for the JiraService token when E2E_MOCK_JIRA=true", async () => {
    process.env.E2E_MOCK_JIRA = "true";

    const moduleRef = await compileJiraModule();

    expect(moduleRef.get(JiraService)).toBeInstanceOf(FakeJiraService);
  });

  it("provides the real JiraService when E2E_MOCK_JIRA is unset", async () => {
    delete process.env.E2E_MOCK_JIRA;

    const moduleRef = await compileJiraModule();

    expect(moduleRef.get(JiraService)).not.toBeInstanceOf(FakeJiraService);
  });
});
