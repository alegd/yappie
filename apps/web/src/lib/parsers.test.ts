import { describe, expect, it } from "vitest";

import { parseSearchParams } from "./parsers";

describe("parseSearchParams", () => {
  it("builds query string from record array", () => {
    const result = parseSearchParams([{ a: "1", b: "2" }]);
    expect(result).toBe("a=1&b=2");
  });

  it("skips undefined null and empty string values", () => {
    const result = parseSearchParams([
      { a: "1" },
      { b: undefined as unknown as string },
      { c: "" },
    ]);
    expect(result).toBe("a=1");
  });

  it("returns empty string when all values filtered out", () => {
    const result = parseSearchParams([{ a: "" }]);
    expect(result).toBe("");
  });
});
