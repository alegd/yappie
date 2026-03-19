import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

function createMockJwt() {
  return {
    signAsync: vi.fn().mockResolvedValue("new-access-token"),
  };
}

describe("AuthService - Refresh Tokens", () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockJwt: ReturnType<typeof createMockJwt>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockJwt = createMockJwt();
    authService = new AuthService(mockPrisma as never, mockJwt as never);
  });

  describe("refresh", () => {
    it("should rotate refresh token and return new token pair", async () => {
      const oldToken = "old-refresh-token";
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        token: oldToken,
        userId: "user-1",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        user: { id: "user-1", email: "john@example.com", name: "John" },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: "rt-2",
        token: "new-refresh-token",
      });

      const result = await authService.refresh(oldToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.refreshToken).not.toBe(oldToken);
      // Old token should be revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rt-1" },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it("should throw UnauthorizedException for expired token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        token: "expired-token",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        revokedAt: null,
        user: { id: "user-1", email: "john@example.com", name: "John" },
      });

      await expect(authService.refresh("expired-token")).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for revoked token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        token: "revoked-token",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // already revoked
        user: { id: "user-1", email: "john@example.com", name: "John" },
      });

      await expect(authService.refresh("revoked-token")).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for non-existent token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refresh("non-existent")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("should revoke the refresh token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        token: "valid-token",
        userId: "user-1",
        revokedAt: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await authService.logout("valid-token");

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rt-1" },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("sessions", () => {
    it("should list active sessions for a user", async () => {
      const sessions = [
        {
          id: "rt-1",
          userAgent: "Chrome",
          ipAddress: "127.0.0.1",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: "rt-2",
          userAgent: "Firefox",
          ipAddress: "192.168.1.1",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockPrisma.refreshToken.findMany.mockResolvedValue(sessions);

      const result = await authService.getSessions("user-1");

      expect(result).toHaveLength(2);
      expect(mockPrisma.refreshToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            revokedAt: null,
          }),
        }),
      );
    });

    it("should revoke a specific session", async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await authService.revokeSession("rt-1", "user-1");

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rt-1" },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it("should revoke all sessions for a user", async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await authService.revokeAllSessions("user-1");

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            revokedAt: null,
          }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
