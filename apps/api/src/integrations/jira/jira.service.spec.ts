import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JiraService } from "./jira.service.js";

function createMockPrisma() {
  return {
    integration: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function createMockConfigService() {
  return {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        JIRA_CLIENT_ID: "test-client-id",
        JIRA_CLIENT_SECRET: "test-client-secret",
        JIRA_CALLBACK_URL: "http://localhost:3001/api/integrations/jira/callback",
      };
      return config[key];
    }),
  };
}

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("JiraService", () => {
  let service: JiraService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockConfig: ReturnType<typeof createMockConfigService>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockConfig = createMockConfigService();
    service = new JiraService(mockPrisma as never, mockConfig as never);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("getAuthUrl", () => {
    it("should return Atlassian OAuth authorization URL", () => {
      const url = service.getAuthUrl();

      expect(url).toContain("https://auth.atlassian.com/authorize");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("redirect_uri=");
      expect(url).toContain("scope=");
    });
  });

  describe("exchangeCode", () => {
    it("should exchange auth code for tokens and save integration", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: "access-123",
                refresh_token: "refresh-123",
                expires_in: 3600,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "cloud-123", name: "My Site" }]),
        });
      });

      mockPrisma.integration.upsert.mockResolvedValue({
        id: "int-1",
        type: "JIRA",
        userId: "user-1",
      });

      const result = await service.exchangeCode("auth-code-123", "user-1");

      expect(result).toHaveProperty("id", "int-1");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh expired token", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        refreshToken: "old-refresh",
        userId: "user-1",
      });
      globalThis.fetch = mockFetchResponse({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
      });
      mockPrisma.integration.upsert.mockResolvedValue({
        id: "int-1",
        accessToken: "new-access",
      });

      const result = await service.refreshAccessToken("user-1");

      expect(result.accessToken).toBe("new-access");
    });

    it("should throw UnauthorizedException if no integration exists", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken("user-1")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getProjects", () => {
    it("should list Jira projects for user", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        accessToken: "valid-token",
        cloudId: "cloud-123",
        userId: "user-1",
      });
      globalThis.fetch = mockFetchResponse([
        { id: "10001", key: "PROJ", name: "My Project" },
        { id: "10002", key: "TEST", name: "Test Project" },
      ]);

      const result = await service.getProjects("user-1");

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe("PROJ");
    });

    it("should throw UnauthorizedException if not connected", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue(null);

      await expect(service.getProjects("user-1")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("createIssue", () => {
    it("should create a Jira issue", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        accessToken: "valid-token",
        cloudId: "cloud-123",
        userId: "user-1",
      });
      globalThis.fetch = mockFetchResponse({
        id: "10001",
        key: "PROJ-1",
        self: "https://mysite.atlassian.net/rest/api/3/issue/10001",
      });

      const result = await service.createIssue("user-1", {
        projectKey: "PROJ",
        summary: "Implement auth",
        description: "Add JWT authentication",
        issueType: "Task",
      });

      expect(result.key).toBe("PROJ-1");
    });

    it("should throw BadRequestException on Jira API error", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        accessToken: "valid-token",
        cloudId: "cloud-123",
        userId: "user-1",
      });
      globalThis.fetch = mockFetchResponse({ errors: { summary: "required" } }, false, 400);

      await expect(
        service.createIssue("user-1", {
          projectKey: "PROJ",
          summary: "",
          description: "desc",
          issueType: "Task",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("disconnect", () => {
    it("should remove the integration", async () => {
      mockPrisma.integration.delete.mockResolvedValue({});

      await service.disconnect("user-1");

      expect(mockPrisma.integration.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_type: { userId: "user-1", type: "JIRA" } },
        }),
      );
    });
  });
});
