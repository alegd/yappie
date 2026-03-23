import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExportService } from "./export.service.js";

function createMockJiraService() {
  return {
    createIssue: vi.fn(),
  };
}

function createMockTicketsService() {
  return {
    findOne: vi.fn(),
    update: vi.fn(),
  };
}

function createMockPrisma() {
  return {
    ticket: {
      update: vi.fn(),
    },
  };
}

function createMockAnalyticsService() {
  return {
    track: vi.fn().mockResolvedValue({}),
  };
}

describe("ExportService", () => {
  let service: ExportService;
  let mockJira: ReturnType<typeof createMockJiraService>;
  let mockTickets: ReturnType<typeof createMockTicketsService>;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    mockJira = createMockJiraService();
    mockTickets = createMockTicketsService();
    mockPrisma = createMockPrisma();
    mockAnalytics = createMockAnalyticsService();
    service = new ExportService(
      mockJira as never,
      mockTickets as never,
      mockPrisma as never,
      mockAnalytics as never,
    );
  });

  describe("exportOne", () => {
    it("should export a ticket to Jira and save issue key", async () => {
      mockTickets.findOne.mockResolvedValue({
        id: "ticket-1",
        title: "Fix login bug",
        description: "Fix the Safari login issue",
        priority: "HIGH",
        status: "APPROVED",
        userId: "user-1",
      });
      mockJira.createIssue.mockResolvedValue({
        key: "PROJ-42",
        self: "https://mysite.atlassian.net/rest/api/3/issue/10001",
      });
      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportOne("user-1", "ticket-1", "PROJ");

      expect(result.key).toBe("PROJ-42");
      expect(mockTickets.findOne).toHaveBeenCalledWith("ticket-1", "user-1");
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: "ticket-1" },
        data: {
          jiraIssueKey: "PROJ-42",
          jiraIssueUrl: "https://mysite.atlassian.net/rest/api/3/issue/10001",
          status: "EXPORTED",
        },
      });
    });
  });

  describe("exportBulk", () => {
    it("should export multiple tickets and return results", async () => {
      const tickets = [
        { id: "t-1", title: "Task 1", description: "Desc 1", priority: "HIGH", status: "APPROVED" },
        {
          id: "t-2",
          title: "Task 2",
          description: "Desc 2",
          priority: "MEDIUM",
          status: "APPROVED",
        },
        { id: "t-3", title: "Task 3", description: "Desc 3", priority: "LOW", status: "APPROVED" },
      ];

      for (const t of tickets) {
        mockTickets.findOne.mockResolvedValueOnce(t);
      }

      mockJira.createIssue
        .mockResolvedValueOnce({ key: "PROJ-1", self: "https://jira/1" })
        .mockResolvedValueOnce({ key: "PROJ-2", self: "https://jira/2" })
        .mockResolvedValueOnce({ key: "PROJ-3", self: "https://jira/3" });

      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportBulk("user-1", ["t-1", "t-2", "t-3"], "PROJ");

      expect(result.exported).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it("should handle partial failures gracefully", async () => {
      const tickets = [
        { id: "t-1", title: "Task 1", description: "Desc 1", priority: "HIGH", status: "APPROVED" },
        {
          id: "t-2",
          title: "Task 2",
          description: "Desc 2",
          priority: "MEDIUM",
          status: "APPROVED",
        },
        { id: "t-3", title: "Task 3", description: "Desc 3", priority: "LOW", status: "APPROVED" },
      ];

      for (const t of tickets) {
        mockTickets.findOne.mockResolvedValueOnce(t);
      }

      mockJira.createIssue
        .mockResolvedValueOnce({ key: "PROJ-1", self: "https://jira/1" })
        .mockRejectedValueOnce(new Error("Jira API error"))
        .mockResolvedValueOnce({ key: "PROJ-3", self: "https://jira/3" });

      mockPrisma.ticket.update.mockResolvedValue({});

      const result = await service.exportBulk("user-1", ["t-1", "t-2", "t-3"], "PROJ");

      expect(result.exported).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results[1]).toHaveProperty("error");
    });
  });
});
