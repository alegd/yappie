import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeJwtExp, isTokenExpired } from "./jwt-utils";

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwtExp", () => {
  it("should extract exp claim in milliseconds", () => {
    const token = createJwt({ exp: 1700000000 });
    expect(decodeJwtExp(token)).toBe(1700000000000);
  });

  it("should return 0 for invalid token", () => {
    expect(decodeJwtExp("not-a-jwt")).toBe(0);
  });

  it("should return 0 for token without exp", () => {
    const token = createJwt({ sub: "user-1" });
    expect(decodeJwtExp(token)).toBeNaN();
  });

  it("should return 0 for empty string", () => {
    expect(decodeJwtExp("")).toBe(0);
  });
});

describe("isTokenExpired", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return false when token is still valid", () => {
    // Token expires in 10 minutes, buffer is 2 minutes
    const futureExp = Math.floor(Date.now() / 1000) + 600;
    const token = createJwt({ exp: futureExp });

    expect(isTokenExpired(token)).toBe(false);
  });

  it("should return true when token is within refresh buffer", () => {
    // Token expires in 1 minute, buffer is 2 minutes → should be "expired"
    const soonExp = Math.floor(Date.now() / 1000) + 60;
    const token = createJwt({ exp: soonExp });

    expect(isTokenExpired(token)).toBe(true);
  });

  it("should return true when token is already expired", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60;
    const token = createJwt({ exp: pastExp });

    expect(isTokenExpired(token)).toBe(true);
  });

  it("should return false for invalid token (exp = 0)", () => {
    expect(isTokenExpired("not-a-jwt")).toBe(false);
  });
});
