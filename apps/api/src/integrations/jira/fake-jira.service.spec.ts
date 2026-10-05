import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeJiraService } from "./fake-jira.service.js";

function createMockPrisma() {
  return {
    integration: {
      findUnique: vi.fn(),
      upsert: vi.fn((args: { create: unknown }) => Promise.resolve(args.create)),
      delete: vi.fn(),
    },
  };
}

function createMockConfigService() {
  return {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        JIRA_CALLBACK_URL: "http://localhost:3011/api/v1/integrations/jira/callback",
        FRONTEND_URL: "http://localhost:3100",
      };
      return config[key];
    }),
  };
}

function createMockCryptoService() {
  return {
    encrypt: vi.fn((val: string) => `encrypted:${val}`),
    decrypt: vi.fn((val: string) => val.replace("encrypted:", "")),
  };
}

function createMockCacheService() {
  return {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    del: vi.fn(),
    invalidate: vi.fn(),
  };
}

describe("FakeJiraService", () => {
  let service: FakeJiraService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockCrypto: ReturnType<typeof createMockCryptoService>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockCrypto = createMockCryptoService();
    globalThis.fetch = vi.fn(() => {
      throw new Error("FakeJiraService must never reach the network");
    }) as never;
    service = new FakeJiraService(
      mockPrisma as never,
      createMockConfigService() as never,
      mockCrypto as never,
      createMockCacheService() as never,
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("getAuthUrl", () => {
    it("points back at this API's own callback instead of Atlassian", () => {
      const url = new URL(service.getAuthUrl("user-1"));

      expect(url.origin + url.pathname).toBe(
        "http://localhost:3011/api/v1/integrations/jira/callback",
      );
      expect(url.searchParams.get("code")).toBeTruthy();
      expect(url.searchParams.get("state")).toBe("user-1");
    });

    it("carries the returnPath through the state so the callback can redirect", () => {
      const url = new URL(service.getAuthUrl("user-1", "/dashboard/projects/abc"));

      expect(url.searchParams.get("state")).toBe("user-1:/dashboard/projects/abc");
    });
  });

  describe("exchangeCode", () => {
    it("persists an integration with encrypted tokens and a site name", async () => {
      await service.exchangeCode("fake-code", "user-1");

      expect(mockPrisma.integration.upsert).toHaveBeenCalledTimes(1);
      const args = mockPrisma.integration.upsert.mock.calls[0][0];
      expect(args.where).toEqual({ userId_type: { userId: "user-1", type: "JIRA" } });
      expect(args.create.accessToken).toMatch(/^encrypted:/);
      expect(args.create.refreshToken).toMatch(/^encrypted:/);
      expect(args.create.siteName).toBeTruthy();
      expect(args.create.cloudId).toBeTruthy();
      expect(args.create.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("getProjects", () => {
    it("returns a selectable project for a connected user", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        cloudId: "fake-cloud-id",
        accessToken: "encrypted:fake-access-token",
        tokenExpiresAt: new Date(Date.now() + 3_600_000),
      });

      const projects = await service.getProjects("user-1");

      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].key).toBeTruthy();
      expect(projects[0].name).toBeTruthy();
    });
  });

  describe("createIssue", () => {
    beforeEach(() => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        cloudId: "fake-cloud-id",
        accessToken: "encrypted:fake-access-token",
        tokenExpiresAt: new Date(Date.now() + 3_600_000),
      });
    });

    it("returns a Jira-shaped key for the requested project", async () => {
      const issue = await service.createIssue("user-1", {
        projectKey: "YAP",
        summary: "Add login button",
        description: "Add a login button to the header.",
        issueType: "Task",
      });

      expect(issue.key).toMatch(/^YAP-\d+$/);
    });

    it("returns a distinct key on every call so exports do not collide", async () => {
      const input = {
        projectKey: "YAP",
        summary: "Add login button",
        description: "Add a login button to the header.",
        issueType: "Task",
      };

      const first = await service.createIssue("user-1", input);
      const second = await service.createIssue("user-1", input);

      expect(first.key).not.toBe(second.key);
    });
  });
});
