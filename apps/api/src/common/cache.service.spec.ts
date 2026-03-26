import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CacheService } from "./cache.service.js";

describe("CacheService", () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve a value", () => {
    service.set("key", { data: "hello" }, 5000);
    expect(service.get("key")).toEqual({ data: "hello" });
  });

  it("should return null for missing key", () => {
    expect(service.get("missing")).toBeNull();
  });

  it("should return null for expired entry", () => {
    service.set("key", "value", 1000);

    vi.advanceTimersByTime(1001);

    expect(service.get("key")).toBeNull();
  });

  it("should return value before TTL expires", () => {
    service.set("key", "value", 5000);

    vi.advanceTimersByTime(4999);

    expect(service.get("key")).toBe("value");
  });

  it("should delete a key", () => {
    service.set("key", "value", 5000);
    service.del("key");
    expect(service.get("key")).toBeNull();
  });

  it("should invalidate keys by prefix", () => {
    service.set("user:1:projects", [1, 2], 5000);
    service.set("user:1:analytics", { count: 5 }, 5000);
    service.set("user:2:projects", [3], 5000);

    service.invalidate("user:1:");

    expect(service.get("user:1:projects")).toBeNull();
    expect(service.get("user:1:analytics")).toBeNull();
    expect(service.get("user:2:projects")).toEqual([3]);
  });

  it("should overwrite existing key", () => {
    service.set("key", "old", 5000);
    service.set("key", "new", 5000);
    expect(service.get("key")).toBe("new");
  });
});
