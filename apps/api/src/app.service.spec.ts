import { describe, it, expect, vi } from "vitest";
import { AppService } from "./app.service.js";

describe("AppService", () => {
  it("should return health status ok", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T00:00:00.000Z"));

    const service = new AppService();
    const result = service.getHealth();

    expect(result).toEqual({
      status: "ok",
      timestamp: "2026-03-14T00:00:00.000Z",
    });

    vi.useRealTimers();
  });
});
