import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
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
  };
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockJwt: ReturnType<typeof createMockJwt>;
  let mockOtp: ReturnType<typeof createMockOtp>;
  let mockEmail: ReturnType<typeof createMockEmail>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockJwt = createMockJwt();
    mockOtp = createMockOtp();
    mockEmail = createMockEmail();
    authService = new AuthService(
      mockPrisma as never,
      mockJwt as never,
      mockOtp as never,
      mockEmail as never,
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
});
