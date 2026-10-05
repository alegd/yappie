import { describe, expect, it } from "vitest";
import { resolveEnvFile } from "./env-file.js";

describe("resolveEnvFile", () => {
  it("loads .env when no env file was injected", () => {
    expect(resolveEnvFile({})).toBe(".env");
  });

  it("loads the injected env file instead of .env", () => {
    expect(resolveEnvFile({ ENV_FILE: ".env.e2e" })).toBe(".env.e2e");
  });

  it("falls back to .env when ENV_FILE is set but empty", () => {
    expect(resolveEnvFile({ ENV_FILE: "" })).toBe(".env");
  });
});
