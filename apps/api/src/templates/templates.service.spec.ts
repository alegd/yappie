import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { TemplatesService } from "./templates.service.js";

function createMockPrisma() {
  return {
    ticketTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe("TemplatesService", () => {
  let service: TemplatesService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  const userId = "user-1";

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new TemplatesService(mockPrisma as never);
  });

  describe("create", () => {
    it("should create a template", async () => {
      mockPrisma.ticketTemplate.create.mockResolvedValue({
        id: "tpl-1",
        name: "Bug Report",
        content: "## Bug\n- Steps to reproduce\n- Expected\n- Actual",
        isDefault: false,
        userId,
      });

      const result = await service.create(userId, {
        name: "Bug Report",
        content: "## Bug\n- Steps to reproduce\n- Expected\n- Actual",
      });

      expect(result.name).toBe("Bug Report");
    });
  });

  describe("findAll", () => {
    it("should return all templates for a user", async () => {
      mockPrisma.ticketTemplate.findMany.mockResolvedValue([
        { id: "tpl-1", name: "Bug Report", userId },
        { id: "tpl-2", name: "Feature", userId },
      ]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
    });
  });

  describe("findOne", () => {
    it("should throw NotFoundException if not found", async () => {
      mockPrisma.ticketTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent", userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a template", async () => {
      mockPrisma.ticketTemplate.findUnique.mockResolvedValue({
        id: "tpl-1",
        userId,
      });
      mockPrisma.ticketTemplate.update.mockResolvedValue({
        id: "tpl-1",
        name: "Updated",
        userId,
      });

      const result = await service.update("tpl-1", userId, { name: "Updated" });

      expect(result.name).toBe("Updated");
    });
  });

  describe("remove", () => {
    it("should delete a template", async () => {
      mockPrisma.ticketTemplate.findUnique.mockResolvedValue({
        id: "tpl-1",
        userId,
      });
      mockPrisma.ticketTemplate.delete.mockResolvedValue({});

      await service.remove("tpl-1", userId);

      expect(mockPrisma.ticketTemplate.delete).toHaveBeenCalledWith({
        where: { id: "tpl-1" },
      });
    });
  });

  describe("getDefault", () => {
    it("should return default template for user", async () => {
      mockPrisma.ticketTemplate.findFirst.mockResolvedValue({
        id: "tpl-1",
        name: "Default",
        content: "## Task\n{{description}}",
        isDefault: true,
        userId,
      });

      const result = await service.getDefault(userId);

      expect(result).not.toBeNull();
      expect(result!.isDefault).toBe(true);
    });

    it("should return null if no default exists", async () => {
      mockPrisma.ticketTemplate.findFirst.mockResolvedValue(null);

      const result = await service.getDefault(userId);

      expect(result).toBeNull();
    });
  });
});
