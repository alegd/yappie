import { describe, it, expect, vi, afterEach } from "vitest";
import { parseSentryRate } from "./sentry-utils";

describe("parseSentryRate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return parsed float for a valid value", () => {
    vi.stubEnv("TEST_RATE", "0.5");
    expect(parseSentryRate("TEST_RATE")).toBe(0.5);
  });

  it("should return 0 as a valid lower boundary", () => {
    vi.stubEnv("TEST_RATE", "0");
    expect(parseSentryRate("TEST_RATE")).toBe(0);
  });

  it("should return 1 as a valid upper boundary", () => {
    vi.stubEnv("TEST_RATE", "1");
    expect(parseSentryRate("TEST_RATE")).toBe(1);
  });

  it("should throw if env var is missing", () => {
    vi.stubEnv("TEST_RATE", "");
    expect(() => parseSentryRate("TEST_RATE")).toThrow("Missing required env var: TEST_RATE");
  });

  it("should throw if value is NaN", () => {
    vi.stubEnv("TEST_RATE", "not-a-number");
    expect(() => parseSentryRate("TEST_RATE")).toThrow(
      'Invalid sample rate for TEST_RATE: "not-a-number"',
    );
  });

  it("should throw if value is negative", () => {
    vi.stubEnv("TEST_RATE", "-0.1");
    expect(() => parseSentryRate("TEST_RATE")).toThrow('Invalid sample rate for TEST_RATE: "-0.1"');
  });

  it("should throw if value is greater than 1", () => {
    vi.stubEnv("TEST_RATE", "1.1");
    expect(() => parseSentryRate("TEST_RATE")).toThrow('Invalid sample rate for TEST_RATE: "1.1"');
  });
});
