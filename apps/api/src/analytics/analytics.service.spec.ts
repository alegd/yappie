import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService } from "./analytics.service.js";

function createMockPrisma() {
  return {
    usageEvent: {
      create: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  const userId = "user-1";

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new AnalyticsService(mockPrisma as never);
  });

  describe("track", () => {
    it("should create a usage event", async () => {
      mockPrisma.usageEvent.create.mockResolvedValue({
        id: "evt-1",
        type: "audio.uploaded",
        userId,
      });

      await service.track(userId, "audio.uploaded", { audioId: "a-1" });

      expect(mockPrisma.usageEvent.create).toHaveBeenCalledWith({
        data: {
          type: "audio.uploaded",
          metadata: { audioId: "a-1" },
          userId,
        },
      });
    });
  });

  describe("getOverview", () => {
    it("should return event counts by type", async () => {
      mockPrisma.usageEvent.groupBy.mockResolvedValue([
        { type: "audio.uploaded", _count: { type: 5 } },
        { type: "ticket.exported", _count: { type: 3 } },
      ]);

      const result = await service.getOverview(userId, {
        from: new Date("2026-01-01"),
        to: new Date("2026-12-31"),
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("type", "audio.uploaded");
      expect(result[0]).toHaveProperty("count", 5);
    });
  });

  describe("countByType", () => {
    it("should return count for a specific event type", async () => {
      mockPrisma.usageEvent.count.mockResolvedValue(7);

      const result = await service.countByType(userId, "audio.uploaded");

      expect(result).toBe(7);
    });
  });
});
