import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateEnv } from "./env.config.js";

describe("validateEnv", () => {
  const validEnv = {
    NODE_ENV: "development",
    PORT: "3001",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "test-secret",
    OPENAI_API_KEY: "sk-test-key",
  };

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should parse valid environment variables", () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }

    const env = validateEnv();

    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(env.JWT_EXPIRATION).toBe("15m");
  });

  it("should exit with code 1 when required vars are missing", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    validateEnv();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should coerce PORT to number", () => {
    for (const [key, value] of Object.entries({ ...validEnv, PORT: "8080" })) {
      vi.stubEnv(key, value);
    }

    const env = validateEnv();
    expect(env.PORT).toBe(8080);
  });
});
