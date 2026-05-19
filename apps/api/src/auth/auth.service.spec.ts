import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
    integration: {
      findUnique: vi.fn(),
    },
    audioRecording: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

function createMockStorage() {
  return {
    save: vi.fn(),
    get: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockJwt() {
  return {
    signAsync: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
}

function createMockOtp() {
  return {
    generateAndStore: vi.fn(),
    verify: vi.fn(),
    markVerified: vi.fn(),
    isVerified: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockEmail() {
  return {
    sendOtp: vi.fn(),
    sendAccountDeletionOtp: vi.fn(),
    sendAccountDeletionConfirmation: vi.fn(),
  };
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockJwt: ReturnType<typeof createMockJwt>;
  let mockOtp: ReturnType<typeof createMockOtp>;
  let mockEmail: ReturnType<typeof createMockEmail>;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockJwt = createMockJwt();
    mockOtp = createMockOtp();
    mockEmail = createMockEmail();
    mockStorage = createMockStorage();
    authService = new AuthService(
      mockPrisma as never,
      mockJwt as never,
      mockOtp as never,
      mockEmail as never,
      mockStorage as never,
    );
  });

  describe("requestOtp", () => {
    it("should generate OTP and send email, returning { sent: true }", async () => {
      // Arrange
      mockOtp.generateAndStore.mockResolvedValue("1234");
      mockEmail.sendOtp.mockResolvedValue(undefined);

      // Act
      const result = await authService.requestOtp("john@example.com");

      // Assert
      expect(mockOtp.generateAndStore).toHaveBeenCalledWith("john@example.com");
      expect(mockEmail.sendOtp).toHaveBeenCalledWith("john@example.com", "1234");
      expect(result).toEqual({ sent: true });
    });
  });

  describe("verifyOtp", () => {
    it("should throw UnauthorizedException for invalid code", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.verifyOtp("john@example.com", "0000")).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.verifyOtp("john@example.com", "0000")).rejects.toThrow(
        "Invalid or expired code",
      );
    });

    it("should return tokens with isNewUser: false for existing user", async () => {
      // Arrange
      const existingUser = {
        id: "user-1",
        email: "john@example.com",
        name: "John Doe",
      };
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1", token: "refresh" });

      // Act
      const result = await authService.verifyOtp("john@example.com", "1234");

      // Assert
      expect(mockOtp.verify).toHaveBeenCalledWith("john@example.com", "1234");
      expect(mockOtp.delete).toHaveBeenCalledWith("john@example.com");
      expect(result).toMatchObject({
        accessToken: "mock-jwt-token",
        isNewUser: false,
        user: { id: "user-1", email: "john@example.com", name: "John Doe" },
      });
      expect(result).toHaveProperty("refreshToken");
    });

    it("should store userAgent and ipAddress on the refresh token when context is provided", async () => {
      const existingUser = { id: "user-1", email: "john@example.com", name: "John Doe" };
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1", token: "refresh" });

      await authService.verifyOtp("john@example.com", "1234", {
        userAgent: "Mozilla/5.0 (TestBrowser)",
        ipAddress: "203.0.113.42",
      });

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userAgent: "Mozilla/5.0 (TestBrowser)",
            ipAddress: "203.0.113.42",
          }),
        }),
      );
    });

    it("should return verified: true with isNewUser: true for new user", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.verifyOtp("new@example.com", "1234");

      // Assert
      expect(mockOtp.verify).toHaveBeenCalledWith("new@example.com", "1234");
      expect(mockOtp.markVerified).toHaveBeenCalledWith("new@example.com");
      expect(result).toEqual({ verified: true, isNewUser: true });
      expect(mockOtp.delete).not.toHaveBeenCalled();
    });
  });

  describe("completeRegister", () => {
    it("should create user and return tokens when OTP is verified", async () => {
      // Arrange
      const newUser = {
        id: "user-2",
        email: "new@example.com",
        name: "Jane Doe",
      };
      mockOtp.isVerified.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1", token: "refresh" });

      // Act
      const result = await authService.completeRegister("new@example.com", "1234", "Jane Doe");

      // Assert
      expect(mockOtp.isVerified).toHaveBeenCalledWith("new@example.com", "1234");
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: "new@example.com", name: "Jane Doe" },
      });
      expect(mockOtp.delete).toHaveBeenCalledWith("new@example.com");
      expect(result).toMatchObject({
        accessToken: "mock-jwt-token",
        user: { id: "user-2", email: "new@example.com", name: "Jane Doe" },
      });
      expect(result).toHaveProperty("refreshToken");
    });

    it("should throw UnauthorizedException when OTP is not verified", async () => {
      // Arrange
      mockOtp.isVerified.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.completeRegister("new@example.com", "0000", "Jane Doe"),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.completeRegister("new@example.com", "0000", "Jane Doe"),
      ).rejects.toThrow("Invalid or expired verification");
    });

    it("should throw ConflictException when email already exists", async () => {
      // Arrange
      mockOtp.isVerified.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: "existing@example.com",
      });

      // Act & Assert
      await expect(
        authService.completeRegister("existing@example.com", "1234", "Jane Doe"),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("requestAccountDeletion", () => {
    it("should generate a purpose-scoped OTP and send the deletion email when the user exists", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "alice@example.com",
      });
      mockOtp.generateAndStore.mockResolvedValue("4242");

      // Act
      const result = await authService.requestAccountDeletion("alice@example.com");

      // Assert
      expect(mockOtp.generateAndStore).toHaveBeenCalledWith(
        "alice@example.com",
        "account-deletion",
      );
      expect(mockEmail.sendAccountDeletionOtp).toHaveBeenCalledWith("alice@example.com", "4242");
      expect(result).toEqual({ requested: true });
    });

    it("should be silent and NOT leak existence when the user does not exist", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.requestAccountDeletion("ghost@example.com");

      // Assert
      expect(mockOtp.generateAndStore).not.toHaveBeenCalled();
      expect(mockEmail.sendAccountDeletionOtp).not.toHaveBeenCalled();
      expect(result).toEqual({ requested: true });
    });
  });

  describe("confirmAccountDeletion", () => {
    it("should throw UnauthorizedException when the OTP is invalid", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.confirmAccountDeletion("alice@example.com", "9999"),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it("should verify with purpose 'account-deletion' to isolate from login OTPs", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockOtp.verify).toHaveBeenCalledWith(
        "alice@example.com",
        "4242",
        "account-deletion",
      );
    });

    it("should delete the user (cascade does the rest) when the OTP is valid", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

    it("should send a confirmation email without Atlassian link when the user had no Jira integration", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockEmail.sendAccountDeletionConfirmation).toHaveBeenCalledWith(
        "alice@example.com",
        { hadJira: false },
      );
    });

    it("should send a confirmation email with hadJira=true when the user had a Jira integration", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue({
        userId: "user-1",
        type: "JIRA",
      });
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockEmail.sendAccountDeletionConfirmation).toHaveBeenCalledWith(
        "alice@example.com",
        { hadJira: true },
      );
    });

    it("should clear the OTP after a successful deletion to prevent reuse", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockOtp.delete).toHaveBeenCalledWith("alice@example.com", "account-deletion");
    });

    it("should delete each audio file from storage before deleting the user", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.audioRecording.findMany.mockResolvedValue([
        { filePath: "user-1/audio1.mp3" },
        { filePath: "user-1/audio2.mp3" },
      ]);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockPrisma.audioRecording.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: { filePath: true },
      });
      expect(mockStorage.delete).toHaveBeenCalledWith("user-1/audio1.mp3");
      expect(mockStorage.delete).toHaveBeenCalledWith("user-1/audio2.mp3");
    });

    it("should still delete the user even if a storage delete fails (best-effort cleanup)", async () => {
      // Arrange
      mockOtp.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      mockPrisma.audioRecording.findMany.mockResolvedValue([
        { filePath: "user-1/audio1.mp3" },
      ]);
      mockStorage.delete.mockRejectedValue(new Error("disk full"));
      mockPrisma.user.delete.mockResolvedValue(undefined);

      // Act
      await authService.confirmAccountDeletion("alice@example.com", "4242");

      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
      expect(mockEmail.sendAccountDeletionConfirmation).toHaveBeenCalled();
    });
  });
});
