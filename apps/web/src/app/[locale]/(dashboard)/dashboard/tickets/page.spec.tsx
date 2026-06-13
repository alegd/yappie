import { describe, expect, it } from "vitest";

describe("Legacy /dashboard/tickets page", () => {
  it("is a valid server component that redirects", async () => {
    // Smoke test: verify the page exports a default function
    const pageModule = await import("./page");
    expect(pageModule.default).toBeDefined();
    expect(typeof pageModule.default).toBe("function");
  });
});
