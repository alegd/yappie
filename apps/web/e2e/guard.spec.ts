import { describe, expect, it } from "vitest";
import { assertE2eTarget } from "./guard";

const safeTarget = {
  NODE_ENV: "test",
  DB_NAME: "yappie_e2e",
  REDIS_URL: "redis://localhost:6379/15",
};

describe("assertE2eTarget", () => {
  it("accepts a target that is test, an e2e database and a non-zero redis index", () => {
    expect(() => assertE2eTarget(safeTarget)).not.toThrow();
  });

  it("refuses when NODE_ENV is not test", () => {
    expect(() => assertE2eTarget({ ...safeTarget, NODE_ENV: "development" })).toThrow(
      /NODE_ENV=development/,
    );
  });

  it("refuses when DB_NAME is not an e2e database", () => {
    expect(() => assertE2eTarget({ ...safeTarget, DB_NAME: "yappie" })).toThrow(/DB_NAME=yappie/);
  });

  it("refuses when DB_NAME is missing", () => {
    expect(() => assertE2eTarget({ ...safeTarget, DB_NAME: undefined })).toThrow();
  });

  it("refuses when REDIS_URL is missing", () => {
    expect(() => assertE2eTarget({ ...safeTarget, REDIS_URL: undefined })).toThrow();
  });

  it("refuses when REDIS_URL carries no explicit database index", () => {
    expect(() => assertE2eTarget({ ...safeTarget, REDIS_URL: "redis://localhost:6379" })).toThrow();
  });

  it("refuses when REDIS_URL targets the default database index 0", () => {
    expect(() =>
      assertE2eTarget({ ...safeTarget, REDIS_URL: "redis://localhost:6379/0" }),
    ).toThrow();
  });

  it("accepts a REDIS_URL that carries query parameters", () => {
    expect(() =>
      assertE2eTarget({ ...safeTarget, REDIS_URL: "redis://localhost:6379/15?family=6" }),
    ).not.toThrow();
  });

  it("refuses database index 0 even with query parameters", () => {
    expect(() =>
      assertE2eTarget({ ...safeTarget, REDIS_URL: "redis://localhost:6379/0?family=6" }),
    ).toThrow();
  });

  it("refuses a REDIS_URL with query parameters but no database index", () => {
    expect(() =>
      assertE2eTarget({ ...safeTarget, REDIS_URL: "redis://localhost:6379?family=6" }),
    ).toThrow();
  });

  it("refuses a REDIS_URL that is not a parseable url", () => {
    expect(() => assertE2eTarget({ ...safeTarget, REDIS_URL: "not-a-url" })).toThrow();
  });

  it("names every offending value in the message so the operator can see the target", () => {
    expect(() =>
      assertE2eTarget({ NODE_ENV: "production", DB_NAME: "yappie", REDIS_URL: "redis://x:6379/0" }),
    ).toThrow(/NODE_ENV=production.*DB_NAME=yappie.*REDIS_URL=redis:\/\/x:6379\/0/s);
  });
});
