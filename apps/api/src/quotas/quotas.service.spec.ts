import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QuotasService } from "./quotas.service.js";

function createMockPrisma() {
  return {
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    audioRecording: {
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
  };
}

function createMockConfigService() {
  const config: Record<string, number> = {
    QUOTA_FREE_MINUTES: 30,
    QUOTA_PRO_MINUTES: 300,
  };
  return {
    get: vi.fn((key: string) => config[key]),
  };
}

function createMockAnalyticsService() {
  return {
    track: vi.fn().mockResolvedValue({}),
  };
}

describe("QuotasService", () => {
  let service: QuotasService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockConfig: ReturnType<typeof createMockConfigService>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockConfig = createMockConfigService();
    mockAnalytics = createMockAnalyticsService();
    service = new QuotasService(mockPrisma as never, mockConfig as never, mockAnalytics as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getQuota", () => {
    it("should auto-create FREE subscription when user has none", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      const now = new Date("2026-03-25T12:00:00Z");
      vi.setSystemTime(now);
      mockPrisma.subscription.create.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate: now,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: null },
      });

      const result = await service.getQuota("user-1");

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: { userId: "user-1", plan: "FREE" },
      });
      expect(result.plan).toBe("FREE");
      expect(result.limitMinutes).toBe(30);
      expect(result.usedMinutes).toBe(0);
      expect(result.remainingMinutes).toBe(30);
    });

    it("should return correct quota for FREE user with usage", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      // 600 seconds = 10 minutes used
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 600 },
      });

      const result = await service.getQuota("user-1");

      expect(result.plan).toBe("FREE");
      expect(result.limitMinutes).toBe(30);
      expect(result.usedMinutes).toBe(10);
      expect(result.remainingMinutes).toBe(20);
      expect(result.cycleStartDate).toEqual(startDate);
    });

    it("should return correct quota for PRO user", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "PRO",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 3600 },
      });

      const result = await service.getQuota("user-1");

      expect(result.plan).toBe("PRO");
      expect(result.limitMinutes).toBe(300);
      expect(result.usedMinutes).toBe(60);
      expect(result.remainingMinutes).toBe(240);
    });

    it("should correctly calculate rolling cycle boundaries", async () => {
      const startDate = new Date("2026-01-15T00:00:00Z");
      vi.setSystemTime(new Date("2026-04-10T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: null },
      });

      const result = await service.getQuota("user-1");

      // N = floor((Apr 10 - Jan 15) / 30 days) = floor(85/30) = 2
      // cycleStart = Jan 15 + 60 days = Mar 16
      // cycleEnd = Mar 16 + 30 days = Apr 15
      expect(result.cycleStartDate).toEqual(new Date("2026-03-16T00:00:00Z"));
      expect(result.cycleEndDate).toEqual(new Date("2026-04-15T00:00:00Z"));
    });

    it("should only count COMPLETED recordings with non-null duration", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 300 },
      });

      await service.getQuota("user-1");

      expect(mockPrisma.audioRecording.aggregate).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          status: "COMPLETED",
          duration: { not: null },
          createdAt: {
            gte: startDate,
            lt: new Date("2026-03-31T00:00:00Z"),
          },
        },
        _sum: { duration: true },
      });
    });

    it("should return 0 remaining when limit is reached", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      // 1800 seconds = 30 minutes = exactly at limit
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 1800 },
      });

      const result = await service.getQuota("user-1");

      expect(result.usedMinutes).toBe(30);
      expect(result.remainingMinutes).toBe(0);
    });

    it("should not count usage from previous cycle", async () => {
      const startDate = new Date("2026-02-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: null },
      });

      const result = await service.getQuota("user-1");

      // N = floor(32/30) = 1, cycleStart = Feb 1 + 30 = Mar 3
      expect(result.cycleStartDate).toEqual(new Date("2026-03-03T00:00:00Z"));
      expect(result.usedMinutes).toBe(0);
    });
  });

  describe("canUpload", () => {
    it("should return true when user has remaining minutes", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 600 },
      });

      const result = await service.canUpload("user-1");

      expect(result).toBe(true);
    });

    it("should return false when user has exhausted quota", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 1800 },
      });

      const result = await service.canUpload("user-1");

      expect(result).toBe(false);
    });

    it("should return true for new user with auto-created FREE subscription", async () => {
      const now = new Date("2026-03-25T12:00:00Z");
      vi.setSystemTime(now);
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate: now,
        endDate: null,
        userId: "user-1",
      });
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: null },
      });

      const result = await service.canUpload("user-1");

      expect(result).toBe(true);
    });
  });

  describe("trackConsumption", () => {
    it("should track analytics event with duration and usage percentage", async () => {
      const startDate = new Date("2026-03-01T00:00:00Z");
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        duration: 120,
        userId: "user-1",
      });
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "FREE",
        startDate,
        endDate: null,
        userId: "user-1",
      });
      // Total usage includes this recording (already COMPLETED)
      mockPrisma.audioRecording.aggregate.mockResolvedValue({
        _sum: { duration: 600 },
      });

      await service.trackConsumption("user-1", "audio-1");

      expect(mockAnalytics.track).toHaveBeenCalledWith("user-1", "quota.consumed", {
        audioId: "audio-1",
        durationSeconds: 120,
        durationMinutes: 2,
        usagePercentage: 33,
        plan: "FREE",
      });
    });

    it("should do nothing when audio recording not found", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue(null);

      await service.trackConsumption("user-1", "nonexistent");

      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });

    it("should do nothing when duration is null", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        duration: null,
        userId: "user-1",
      });

      await service.trackConsumption("user-1", "audio-1");

      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });
  });
});
