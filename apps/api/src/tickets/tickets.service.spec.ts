import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { TicketsService } from "./tickets.service.js";

function createMockPrisma() {
  return {
    ticket: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe("TicketsService", () => {
  let service: TicketsService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const mockTicket = {
    id: "ticket-1",
    title: "Implement auth",
    description: "Add JWT auth",
    status: "DRAFT",
    priority: "HIGH",
    audioRecordingId: "audio-1",
    projectId: "proj-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new TicketsService(mockPrisma as never);
  });

  describe("create", () => {
    it("should create a ticket", async () => {
      mockPrisma.ticket.create.mockResolvedValue(mockTicket);

      const result = await service.create({
        title: "Implement auth",
        description: "Add JWT auth",
        priority: "HIGH",
        audioRecordingId: "audio-1",
        projectId: "proj-1",
      });

      expect(result).toEqual(mockTicket);
    });
  });

  describe("findAll", () => {
    it("should return paginated tickets with filters", async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.ticket.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        status: "DRAFT",
        priority: "HIGH",
        projectId: "proj-1",
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "DRAFT",
            priority: "HIGH",
            projectId: "proj-1",
          }),
        }),
      );
    });

    it("should return all tickets without filters", async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      mockPrisma.ticket.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return a ticket by id", async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.findOne("ticket-1");

      expect(result.id).toBe("ticket-1");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a ticket", async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({ ...mockTicket, title: "Updated" });

      const result = await service.update("ticket-1", { title: "Updated" });

      expect(result.title).toBe("Updated");
    });
  });

  describe("approve", () => {
    it("should set ticket status to APPROVED", async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({ ...mockTicket, status: "APPROVED" });

      const result = await service.approve("ticket-1");

      expect(result.status).toBe("APPROVED");
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: "ticket-1" },
        data: { status: "APPROVED" },
      });
    });
  });

  describe("remove", () => {
    it("should delete a ticket", async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.delete.mockResolvedValue(mockTicket);

      await service.remove("ticket-1");

      expect(mockPrisma.ticket.delete).toHaveBeenCalledWith({ where: { id: "ticket-1" } });
    });
  });
});
