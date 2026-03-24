import { describe, expect, it } from "vitest";

import { parseResponse } from "./response";

describe("parseResponse", () => {
  it("parses JSON body and returns object", async () => {
    const res = new Response('{"a":1}');
    expect(await parseResponse(res)).toEqual({ a: 1 });
  });

  it("returns null for empty body", async () => {
    const res = new Response("");
    expect(await parseResponse(res)).toBe(null);
  });
});
