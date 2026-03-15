import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import * as bcrypt from "bcryptjs";

// Mock PrismaService
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

// Mock JwtService
function createMockJwt() {
  return {
    signAsync: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockJwt: ReturnType<typeof createMockJwt>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockJwt = createMockJwt();
    authService = new AuthService(mockPrisma as never, mockJwt as never);
  });

  describe("register", () => {
    const registerDto = {
      name: "John Doe",
      email: "john@example.com",
      password: "securePassword123",
    };

    it("should hash the password before saving", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        email: registerDto.email,
        name: registerDto.name,
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: "rt-1",
        token: "refresh-token",
      });

      await authService.register(registerDto);

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe(registerDto.password);
      expect(await bcrypt.compare(registerDto.password, createCall.data.password)).toBe(true);
    });

    it("should create a user and return tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        email: registerDto.email,
        name: registerDto.name,
        password: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: "rt-1",
        token: "refresh-token",
      });

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw ConflictException if email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: registerDto.email,
      });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "john@example.com",
      password: "securePassword123",
    };

    it("should return tokens for valid credentials", async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: loginDto.email,
        name: "John Doe",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: "rt-1",
        token: "refresh-token",
      });

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw UnauthorizedException for non-existent email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for wrong password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: loginDto.email,
        name: "John Doe",
        password: await bcrypt.hash("differentPassword", 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
