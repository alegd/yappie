import { z } from "zod";
import { e2eFlagsSafe } from "./env.config.js";

const boolFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

describe("e2e env flags", () => {
  it("parses 'true'/'false' env strings into booleans", () => {
    const schema = z.object({ E2E_MOCK_AI: boolFromEnv });
    expect(schema.parse({ E2E_MOCK_AI: "true" }).E2E_MOCK_AI).toBe(true);
    expect(schema.parse({}).E2E_MOCK_AI).toBe(false);
  });

  it("e2eFlagsSafe is false when a flag is on under production", () => {
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: true, E2E_MOCK_AI: false }),
    ).toBe(false);
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: false, E2E_MOCK_AI: true }),
    ).toBe(false);
  });

  it("e2eFlagsSafe is true when flags are on outside production", () => {
    expect(e2eFlagsSafe({ NODE_ENV: "test", E2E_TEST_ENDPOINTS: true, E2E_MOCK_AI: true })).toBe(
      true,
    );
  });

  it("e2eFlagsSafe is true when flags are off in production", () => {
    expect(
      e2eFlagsSafe({ NODE_ENV: "production", E2E_TEST_ENDPOINTS: false, E2E_MOCK_AI: false }),
    ).toBe(true);
  });
});
