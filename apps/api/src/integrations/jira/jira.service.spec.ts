import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
        JIRA_CALLBACK_URL: "http://localhost:3001/api/v1/integrations/jira/callback",
        FRONTEND_URL: "https://yappie.gueden.com",
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
  let mockCrypto: ReturnType<typeof createMockCryptoService>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockConfig = createMockConfigService();
    mockCrypto = createMockCryptoService();
    service = new JiraService(
      mockPrisma as never,
      mockConfig as never,
      mockCrypto as never,
      createMockCacheService() as never,
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("getAuthUrl", () => {
    it("should return Atlassian OAuth authorization URL", () => {
      const url = service.getAuthUrl("user-1");

      expect(url).toContain("https://auth.atlassian.com/authorize");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("redirect_uri=");
      expect(url).toContain("scope=");
      expect(url).toContain("state=user-1");
    });
  });

  describe("buildPostAuthRedirect", () => {
    it("should redirect to default frontend settings when no returnPath", () => {
      const url = service.buildPostAuthRedirect();

      expect(url).toBe("https://yappie.gueden.com/dashboard/settings?jira=connected");
    });

    it("should redirect to a path on the frontend when returnPath starts with /", () => {
      const url = service.buildPostAuthRedirect("/dashboard/projects/abc");

      expect(url).toBe("https://yappie.gueden.com/dashboard/projects/abc?jira=connected");
    });

    it("should redirect to the mobile deep link when returnPath uses the yappie:// scheme", () => {
      const url = service.buildPostAuthRedirect("yappie://settings");

      expect(url).toBe("yappie://settings?jira=connected");
    });

    it("should fall back to default frontend path for unknown schemes (no open redirect)", () => {
      const url = service.buildPostAuthRedirect("https://evil.example.com/steal");

      expect(url).toBe("https://yappie.gueden.com/dashboard/settings?jira=connected");
    });

    it("should fall back to default for protocol-relative URLs", () => {
      const url = service.buildPostAuthRedirect("//evil.example.com");

      expect(url).toBe("https://yappie.gueden.com/dashboard/settings?jira=connected");
    });

    it("should preserve existing query params on a frontend path", () => {
      const url = service.buildPostAuthRedirect("/dashboard?tab=integrations");

      expect(url).toBe(
        "https://yappie.gueden.com/dashboard?tab=integrations&jira=connected",
      );
    });

    it("should preserve existing query params on a mobile deep link", () => {
      const url = service.buildPostAuthRedirect("yappie://settings?section=jira");

      expect(url).toBe("yappie://settings?section=jira&jira=connected");
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

  describe("refreshAccessToken", () => {
    it("should not leak internal Jira error bodies to the caller", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: "invalid_client",
              error_description: "Client authentication failed: <internal trace>",
            }),
          ),
      });

      const errorPromise = service.exchangeCode("bad-code", "user-1");
      await expect(errorPromise).rejects.not.toThrow(/invalid_client/);
      await expect(errorPromise).rejects.not.toThrow(/internal trace/);
      await expect(errorPromise).rejects.toThrow(BadRequestException);
    });

    it("should reject malformed token responses from Jira", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: "only-this-field" }),
      });

      await expect(service.exchangeCode("code", "user-1")).rejects.toThrow(/jira/i);
    });

    it("should throw UnauthorizedException if integration has no refreshToken", async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        refreshToken: null,
        userId: "user-1",
      });

      await expect(service.refreshAccessToken("user-1")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getProjects", () => {
    it("should return cached projects without hitting the API", async () => {
      const cached = [{ id: "10001", key: "PROJ", name: "My Project" }];
      const mockCacheService = createMockCacheService();
      mockCacheService.get.mockReturnValue(cached);
      service = new JiraService(
        mockPrisma as never,
        mockConfig as never,
        mockCrypto as never,
        mockCacheService as never,
      );

      const result = await service.getProjects("user-1");

      expect(result).toBe(cached);
      expect(mockPrisma.integration.findUnique).not.toHaveBeenCalled();
    });

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

  describe("getIntegration (auto-refresh)", () => {
    it("should auto-refresh access token when token is expired", async () => {
      const expiredAt = new Date(Date.now() - 1000); // already expired
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: "int-1",
        accessToken: "encrypted:old-access",
        refreshToken: "encrypted:old-refresh",
        cloudId: "cloud-123",
        tokenExpiresAt: expiredAt,
        userId: "user-1",
      });
      globalThis.fetch = mockFetchResponse({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
      });
      mockPrisma.integration.upsert.mockResolvedValue({
        id: "int-1",
        accessToken: "encrypted:new-access",
        refreshToken: "encrypted:new-refresh",
        cloudId: "cloud-123",
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        userId: "user-1",
      });
      // second fetch for getProjects API call
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "new-access",
              refresh_token: "new-refresh",
              expires_in: 3600,
            }),
          text: () => Promise.resolve(""),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: "10001", key: "PROJ", name: "My Project" }]),
          text: () => Promise.resolve(""),
        });

      const result = await service.getProjects("user-1");

      expect(mockPrisma.integration.upsert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
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
