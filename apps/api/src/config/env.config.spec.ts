import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateEnv, buildDatabaseUrl } from "./env.config.js";

describe("validateEnv", () => {
  const validEnv: Record<string, string> = {
    NODE_ENV: "development",
    PORT: "3001",
    DB_HOST: "localhost",
    DB_PORT: "5432",
    DB_USER: "yappie",
    DB_PASSWORD: "yappie_dev",
    DB_NAME: "yappie",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "test-secret",
    JWT_EXPIRATION: "15m",
    JWT_REFRESH_EXPIRATION: "7d",
    OPENAI_API_KEY: "sk-test-key",
    AI_TRANSCRIPTION_MODEL: "whisper-1",
    AI_DECOMPOSITION_MODEL: "gpt-4o-mini",
    AI_GENERATION_MODEL: "gpt-4o-mini",
    UPLOAD_PATH: "./uploads",
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    FRONTEND_URL: "http://localhost:3000",
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
    expect(env.DB_HOST).toBe("localhost");
    expect(env.DB_NAME).toBe("yappie");
    expect(env.AI_GENERATION_MODEL).toBe("gpt-4o-mini");
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

describe("buildDatabaseUrl", () => {
  it("should build a postgresql connection string from DB_* vars", () => {
    const env = {
      DB_HOST: "myhost",
      DB_PORT: 5433,
      DB_USER: "admin",
      DB_PASSWORD: "secret",
      DB_NAME: "mydb",
    };

    const url = buildDatabaseUrl(env as never);

    expect(url).toBe("postgresql://admin:secret@myhost:5433/mydb");
  });
});
