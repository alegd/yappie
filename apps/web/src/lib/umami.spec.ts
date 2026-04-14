import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getUmamiConfig } from "./umami";

describe("getUmamiConfig", () => {
  let originalSrc: string | undefined;
  let originalId: string | undefined;

  beforeEach(() => {
    originalSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
    originalId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    delete process.env.NEXT_PUBLIC_UMAMI_SRC;
    delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  });

  afterEach(() => {
    if (originalSrc !== undefined) process.env.NEXT_PUBLIC_UMAMI_SRC = originalSrc;
    if (originalId !== undefined) process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = originalId;
  });

  it("should return null when both env vars are unset", () => {
    expect(getUmamiConfig()).toBeNull();
  });

  it("should return null when only the src is set", () => {
    process.env.NEXT_PUBLIC_UMAMI_SRC = "https://umami.example.com/script.js";

    expect(getUmamiConfig()).toBeNull();
  });

  it("should return null when only the website id is set", () => {
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "abc-123";

    expect(getUmamiConfig()).toBeNull();
  });

  it("should return null when either var is an empty string", () => {
    process.env.NEXT_PUBLIC_UMAMI_SRC = "";
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "abc-123";

    expect(getUmamiConfig()).toBeNull();
  });

  it("should return the config when both vars are set", () => {
    process.env.NEXT_PUBLIC_UMAMI_SRC = "https://umami.example.com/script.js";
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "abc-123";

    expect(getUmamiConfig()).toEqual({
      src: "https://umami.example.com/script.js",
      websiteId: "abc-123",
    });
  });
});
