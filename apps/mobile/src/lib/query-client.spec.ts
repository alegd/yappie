// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createQueryClient } = require("./query-client") as typeof import("./query-client");

describe("createQueryClient", () => {
  it("returns a QueryClient with retry=2, staleTime=30s, gcTime=5min", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(2);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(5 * 60_000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
  });

  it("disables mutation auto-retry", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(0);
  });

  it("retryDelay is a function (exponential backoff)", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(typeof defaults.queries?.retryDelay).toBe("function");
  });

  it("retryDelay caps at 30 seconds", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    const retryDelay = defaults.queries?.retryDelay as (attempt: number, error: Error) => number;
    // attempt 10 would be 2^10 = 1024 seconds without cap; ensure capped at 30s
    expect(retryDelay(10, new Error("x"))).toBe(30_000);
  });
});
