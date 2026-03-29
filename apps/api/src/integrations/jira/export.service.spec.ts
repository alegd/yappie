import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ExportService } from "./export.service.js";

function createMockJiraService() {
  return {
    createIssue: vi.fn(),
    getStatus: vi
      .fn()
      .mockResolvedValue({ connected: true, siteName: "mysite", connectedAt: null }),
  };
}

function createMockPrisma() {
  return {
    ticket: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
}

function createMockAnalyticsService() {
  return {
    track: vi.fn().mockResolvedValue({}),
  };
}

const baseTicket = {
  id: "ticket-1",
  title: "Fix login bug",
  description: "Fix the Safari login issue",
  priority: "HIGH",
  status: "APPROVED",
  userId: "user-1",
  projectId: "project-1",
  project: { id: "project-1", jiraProjectKey: "PROJ" },
};

describe("ExportService", () => {
  let service: ExportService;
  let mockJira: ReturnType<typeof createMockJiraService>;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    mockJira = createMockJiraService();
    mockPrisma = createMockPrisma();
    mockAnalytics = createMockAnalyticsService();
    service = new ExportService(mockJira as never, mockPrisma as never, mockAnalytics as never);
  });

  describe("exportOne", () => {
    it("should export a ticket to Jira and save issue key", async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(baseTicket);
      mockJira.createIssue.mockResolvedValue({
        key: "PROJ-42",
        self: "https://mysite.atlassian.net/rest/api/3/issue/10001",
      });
      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportOne("user-1", "ticket-1");

      expect(result.key).toBe("PROJ-42");
      expect(mockPrisma.ticket.findFirst).toHaveBeenCalledWith({
        where: { id: "ticket-1", userId: "user-1" },
        include: { project: true },
      });
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: "ticket-1" },
        data: {
          jiraIssueKey: "PROJ-42",
          jiraIssueUrl: "https://mysite.atlassian.net/browse/PROJ-42",
          status: "EXPORTED",
        },
      });
    });

    it("should throw NotFoundException if ticket not found", async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.exportOne("user-1", "ticket-1")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if ticket has no project", async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue({
        ...baseTicket,
        projectId: null,
        project: null,
      });

      await expect(service.exportOne("user-1", "ticket-1")).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if project has no jiraProjectKey", async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue({
        ...baseTicket,
        project: { id: "project-1", jiraProjectKey: null },
      });

      await expect(service.exportOne("user-1", "ticket-1")).rejects.toThrow(BadRequestException);
    });
  });

  describe("exportBulk", () => {
    it("should export multiple tickets and return results", async () => {
      const tickets = [
        { ...baseTicket, id: "t-1" },
        { ...baseTicket, id: "t-2" },
        { ...baseTicket, id: "t-3" },
      ];

      for (const t of tickets) {
        mockPrisma.ticket.findFirst.mockResolvedValueOnce(t);
      }

      mockJira.createIssue
        .mockResolvedValueOnce({ key: "PROJ-1", self: "https://jira/1" })
        .mockResolvedValueOnce({ key: "PROJ-2", self: "https://jira/2" })
        .mockResolvedValueOnce({ key: "PROJ-3", self: "https://jira/3" });

      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportBulk("user-1", ["t-1", "t-2", "t-3"]);

      expect(result.exported).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it("should use 'Unknown error' when a non-Error is thrown", async () => {
      mockPrisma.ticket.findFirst.mockResolvedValueOnce({ ...baseTicket, id: "t-1" });
      // Throw a non-Error value (plain string)
      mockJira.createIssue.mockRejectedValueOnce("plain string error");

      const result = await service.exportBulk("user-1", ["t-1"]);

      expect(result.failed).toBe(1);
      expect(result.results[0]).toHaveProperty("error", "Unknown error");
    });

    it("should handle partial failures gracefully", async () => {
      const tickets = [
        { ...baseTicket, id: "t-1" },
        { ...baseTicket, id: "t-2" },
        { ...baseTicket, id: "t-3" },
      ];

      for (const t of tickets) {
        mockPrisma.ticket.findFirst.mockResolvedValueOnce(t);
      }

      mockJira.createIssue
        .mockResolvedValueOnce({ key: "PROJ-1", self: "https://jira/1" })
        .mockRejectedValueOnce(new Error("Jira API error"))
        .mockResolvedValueOnce({ key: "PROJ-3", self: "https://jira/3" });

      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportBulk("user-1", ["t-1", "t-2", "t-3"]);

      expect(result.exported).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results[1]).toHaveProperty("error");
    });
  });
});
