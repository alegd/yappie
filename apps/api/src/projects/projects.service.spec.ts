import { describe, it, expect, beforeEach, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";

function createMockPrisma() {
  return {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe("ProjectsService", () => {
  let service: ProjectsService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const userId = "user-1";
  const mockProject = {
    id: "proj-1",
    name: "My Project",
    description: "A test project",
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ProjectsService(mockPrisma as never);
  });

  describe("create", () => {
    it("should create a project for the user", async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject);

      const result = await service.create(userId, {
        name: "My Project",
        description: "A test project",
      });

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: "My Project",
          description: "A test project",
          userId,
        },
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated projects for the user", async () => {
      const projects = [mockProject];
      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.project.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toEqual(projects);
      expect(result.total).toBe(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a project owned by the user", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne("proj-1", userId);

      expect(result).toEqual(mockProject);
    });

    it("should throw NotFoundException if project does not exist", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent", userId)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if project belongs to another user", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        userId: "other-user",
      });

      await expect(service.findOne("proj-1", userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("update", () => {
    it("should update a project owned by the user", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue({
        ...mockProject,
        name: "Updated Name",
      });

      const result = await service.update("proj-1", userId, { name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
    });
  });

  describe("remove", () => {
    it("should delete a project owned by the user", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);

      await service.remove("proj-1", userId);

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: "proj-1" },
      });
    });

    it("should throw ForbiddenException when deleting another user's project", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        userId: "other-user",
      });

      await expect(service.remove("proj-1", userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
