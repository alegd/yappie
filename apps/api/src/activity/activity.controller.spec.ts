import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActivityController } from "./activity.controller.js";

describe("ActivityController", () => {
  let controller: ActivityController;
  const mockService = { findRecent: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller = new ActivityController(mockService as any);
  });

  it("calls service with default limit 10", async () => {
    mockService.findRecent.mockResolvedValue({ data: [], total: 0 });
    await controller.findRecent({ user: { sub: "u-1" } }, "10");
    expect(mockService.findRecent).toHaveBeenCalledWith("u-1", 10);
  });

  it("respects custom limit query param", async () => {
    mockService.findRecent.mockResolvedValue({ data: [], total: 0 });
    await controller.findRecent({ user: { sub: "u-1" } }, "5");
    expect(mockService.findRecent).toHaveBeenCalledWith("u-1", 5);
  });

  it("clamps limit to max 50", async () => {
    mockService.findRecent.mockResolvedValue({ data: [], total: 0 });
    await controller.findRecent({ user: { sub: "u-1" } }, "999");
    expect(mockService.findRecent).toHaveBeenCalledWith("u-1", 50);
  });

  it("clamps limit to min 1", async () => {
    mockService.findRecent.mockResolvedValue({ data: [], total: 0 });
    await controller.findRecent({ user: { sub: "u-1" } }, "0");
    expect(mockService.findRecent).toHaveBeenCalledWith("u-1", 1);
  });

  it("defaults limit to 10 when query missing/NaN", async () => {
    mockService.findRecent.mockResolvedValue({ data: [], total: 0 });
    await controller.findRecent({ user: { sub: "u-1" } }, "not-a-number");
    expect(mockService.findRecent).toHaveBeenCalledWith("u-1", 10);
  });
});
