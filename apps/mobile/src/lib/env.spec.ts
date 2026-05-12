// Must be set before the module is loaded so the eager export const env = loadEnv() doesn't throw.
process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnv } = require("./env") as typeof import("./env");

describe("loadEnv", () => {
  it("should return parsed env when EXPO_PUBLIC_API_URL is set", () => {
    const env = loadEnv({ EXPO_PUBLIC_API_URL: "https://api.example.com" });
    expect(env.apiUrl).toBe("https://api.example.com");
    expect(env.sentryDsn).toBeUndefined();
  });

  it("should include sentryDsn when EXPO_PUBLIC_SENTRY_DSN is set", () => {
    const env = loadEnv({
      EXPO_PUBLIC_API_URL: "https://api.example.com",
      EXPO_PUBLIC_SENTRY_DSN: "https://sentry.example.com/123",
    });
    expect(env.sentryDsn).toBe("https://sentry.example.com/123");
  });

  it("should throw when EXPO_PUBLIC_API_URL is missing", () => {
    expect(() => loadEnv({})).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it("should throw when EXPO_PUBLIC_API_URL is not a valid URL", () => {
    expect(() => loadEnv({ EXPO_PUBLIC_API_URL: "not-a-url" })).toThrow();
  });
});
