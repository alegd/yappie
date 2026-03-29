import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service.js";

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
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    usersService = new UsersService(mockPrisma as never);
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.getProfile("user-1");

      expect(result).toHaveProperty("id", "user-1");
      expect(result).toHaveProperty("email", "john@example.com");
      expect(result).toHaveProperty("name", "John Doe");
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
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "Jane Doe" },
      });
    });
  });
});
