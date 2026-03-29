import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppService } from "./app.service.js";

function createMockPrisma() {
  return {
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  };
}

function createMockRedis() {
  return {
    ping: vi.fn().mockResolvedValue("PONG"),
  };
}

describe("AppService", () => {
  let service: AppService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T00:00:00.000Z"));
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    service = new AppService(mockPrisma as never, mockRedis as never);
  });

  it("should return ok when all services are up", async () => {
    const result = await service.getHealth();

    expect(result).toEqual({
      status: "ok",
      timestamp: "2026-03-14T00:00:00.000Z",
      services: { database: "up", redis: "up" },
    });
  });

  it("should return degraded when database is down", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("Connection refused"));

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("down");
    expect(result.services.redis).toBe("up");
  });

  it("should return degraded when redis is down", async () => {
    mockRedis.ping.mockRejectedValue(new Error("Connection refused"));

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("up");
    expect(result.services.redis).toBe("down");
  });

  it("should return degraded when both are down", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("DB down"));
    mockRedis.ping.mockRejectedValue(new Error("Redis down"));

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("down");
    expect(result.services.redis).toBe("down");
  });
});
