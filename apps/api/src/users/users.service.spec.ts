import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import * as bcrypt from "bcryptjs";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("UsersService", () => {
  let usersService: UsersService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const mockUser = {
    id: "user-1",
    email: "john@example.com",
    name: "John Doe",
    password: "hashed-password",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    usersService = new UsersService(mockPrisma as never);
  });

  describe("getProfile", () => {
    it("should return user profile without password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.getProfile("user-1");

      expect(result).toHaveProperty("id", "user-1");
      expect(result).toHaveProperty("email", "john@example.com");
      expect(result).toHaveProperty("name", "John Doe");
      expect(result).not.toHaveProperty("password");
    });

    it("should throw NotFoundException if user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.getProfile("non-existent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateProfile", () => {
    it("should update user name", async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        name: "Jane Doe",
      });

      const result = await usersService.updateProfile("user-1", { name: "Jane Doe" });

      expect(result.name).toBe("Jane Doe");
      expect(result).not.toHaveProperty("password");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "Jane Doe" },
      });
    });
  });

  describe("changePassword", () => {
    it("should change password when current password is correct", async () => {
      const currentPassword = "oldPassword123";
      const hashedCurrent = await bcrypt.hash(currentPassword, 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedCurrent,
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword("user-1", currentPassword, "newPassword456");

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { password: expect.any(String) },
      });
      // Verify new password is hashed (not plain text)
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.password).not.toBe("newPassword456");
      expect(await bcrypt.compare("newPassword456", updateCall.data.password)).toBe(true);
    });

    it("should throw UnauthorizedException when current password is wrong", async () => {
      const hashedPassword = await bcrypt.hash("correctPassword", 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        usersService.changePassword("user-1", "wrongPassword", "newPassword456"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.changePassword("non-existent", "old", "new")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
