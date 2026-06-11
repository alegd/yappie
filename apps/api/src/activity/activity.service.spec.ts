import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActivityService } from "./activity.service.js";

function createMockPrisma() {
  return {
    audioRecording: {
      findMany: vi.fn(),
    },
    ticket: {
      findMany: vi.fn(),
    },
  };
}

describe("ActivityService", () => {
  let service: ActivityService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const userId = "user-1";

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ActivityService(mockPrisma as never);
  });

  describe("findRecent", () => {
    it("returns audio.uploaded events from latest audios", async () => {
      mockPrisma.audioRecording.findMany.mockImplementation(({ where }) => {
        if (where?.status === "COMPLETED") return Promise.resolve([]);
        return Promise.resolve([
          {
            id: "a-1",
            fileName: "rec1.webm",
            projectId: "p-1",
            createdAt: new Date("2026-06-11T10:00:00Z"),
            updatedAt: new Date("2026-06-11T10:00:00Z"),
            project: { name: "InstaCaribe" },
          },
        ]);
      });
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await service.findRecent(userId, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        type: "audio.uploaded",
        audioId: "a-1",
        fileName: "rec1.webm",
        projectId: "p-1",
        projectName: "InstaCaribe",
      });
    });

    it("returns audio.completed events with ticketCount from COMPLETED audios", async () => {
      mockPrisma.audioRecording.findMany.mockImplementation(({ where }) => {
        if (where?.status === "COMPLETED") {
          return Promise.resolve([
            {
              id: "a-2",
              fileName: "rec2.webm",
              projectId: "p-1",
              updatedAt: new Date("2026-06-11T11:00:00Z"),
              createdAt: new Date("2026-06-11T10:00:00Z"),
              project: { name: "InstaCaribe" },
              _count: { tickets: 3 },
            },
          ]);
        }
        return Promise.resolve([]);
      });
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await service.findRecent(userId, 10);

      const completed = result.data.find((d) => d.type === "audio.completed");
      expect(completed).toBeDefined();
      expect(completed).toMatchObject({
        type: "audio.completed",
        audioId: "a-2",
        ticketCount: 3,
        projectName: "InstaCaribe",
      });
    });

    it("returns ticket.exported events from EXPORTED tickets", async () => {
      mockPrisma.audioRecording.findMany.mockResolvedValue([]);
      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: "t-1",
          title: "Fix bug",
          jiraIssueKey: "PROJ-1",
          jiraIssueUrl: "https://x.atlassian.net/browse/PROJ-1",
          projectId: "p-1",
          updatedAt: new Date("2026-06-11T12:00:00Z"),
          project: { name: "InstaCaribe" },
        },
      ]);

      const result = await service.findRecent(userId, 10);

      const exported = result.data.find((d) => d.type === "ticket.exported");
      expect(exported).toMatchObject({
        type: "ticket.exported",
        ticketId: "t-1",
        ticketTitle: "Fix bug",
        jiraIssueKey: "PROJ-1",
        projectName: "InstaCaribe",
      });
    });

    it("merges and sorts events by timestamp DESC", async () => {
      mockPrisma.audioRecording.findMany.mockImplementation(({ where }) => {
        if (where?.status === "COMPLETED") {
          return Promise.resolve([
            {
              id: "a-old",
              fileName: "old.webm",
              projectId: "p-1",
              updatedAt: new Date("2026-06-10T08:00:00Z"),
              createdAt: new Date("2026-06-10T07:00:00Z"),
              project: { name: "P1" },
              _count: { tickets: 1 },
            },
          ]);
        }
        return Promise.resolve([
          {
            id: "a-new",
            fileName: "new.webm",
            projectId: "p-1",
            createdAt: new Date("2026-06-11T15:00:00Z"),
            updatedAt: new Date("2026-06-11T15:00:00Z"),
            project: { name: "P1" },
          },
        ]);
      });
      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: "t-mid",
          title: "Mid",
          jiraIssueKey: "X-1",
          jiraIssueUrl: null,
          projectId: "p-1",
          updatedAt: new Date("2026-06-11T12:00:00Z"),
          project: { name: "P1" },
        },
      ]);

      const result = await service.findRecent(userId, 10);

      expect(result.data).toHaveLength(3);
      expect(result.data[0].audioId).toBe("a-new"); // newest first
      expect(result.data[2]).toMatchObject({ audioId: "a-old" });
    });

    it("respects limit and truncates", async () => {
      const manyAudios = Array.from({ length: 15 }, (_, i) => ({
        id: `a-${i}`,
        fileName: `f${i}.webm`,
        projectId: "p-1",
        createdAt: new Date(2026, 5, 11, 10, i),
        updatedAt: new Date(2026, 5, 11, 10, i),
        project: { name: "P1" },
      }));
      mockPrisma.audioRecording.findMany.mockImplementation(({ where }) =>
        Promise.resolve(where?.status === "COMPLETED" ? [] : manyAudios),
      );
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await service.findRecent(userId, 5);

      expect(result.data).toHaveLength(5);
    });

    it("scopes queries by userId", async () => {
      mockPrisma.audioRecording.findMany.mockResolvedValue([]);
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await service.findRecent(userId, 10);

      expect(mockPrisma.audioRecording.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId }) }),
      );
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId }) }),
      );
    });

    it("returns total = data.length", async () => {
      mockPrisma.audioRecording.findMany.mockResolvedValue([]);
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await service.findRecent(userId, 10);

      expect(result.total).toBe(result.data.length);
    });
  });
});
