// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ApiError } = require("./api-error") as typeof import("./api-error");

describe("ApiError", () => {
  it("exposes status, body, and message", () => {
    const err = new ApiError(400, { error: "bad" }, "Bad request");
    expect(err.status).toBe(400);
    expect(err.body).toEqual({ error: "bad" });
    expect(err.message).toBe("Bad request");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
  });

  it("isAuth is true only for 401", () => {
    expect(new ApiError(401, null, "x").isAuth).toBe(true);
    expect(new ApiError(403, null, "x").isAuth).toBe(false);
    expect(new ApiError(400, null, "x").isAuth).toBe(false);
  });

  it("isThrottled is true only for 429", () => {
    expect(new ApiError(429, null, "x").isThrottled).toBe(true);
    expect(new ApiError(400, null, "x").isThrottled).toBe(false);
  });

  it("isClientError is true for 4xx (400-499)", () => {
    expect(new ApiError(400, null, "x").isClientError).toBe(true);
    expect(new ApiError(404, null, "x").isClientError).toBe(true);
    expect(new ApiError(499, null, "x").isClientError).toBe(true);
    expect(new ApiError(500, null, "x").isClientError).toBe(false);
    expect(new ApiError(399, null, "x").isClientError).toBe(false);
  });

  it("isServerError is true for 5xx (500-599)", () => {
    expect(new ApiError(500, null, "x").isServerError).toBe(true);
    expect(new ApiError(503, null, "x").isServerError).toBe(true);
    expect(new ApiError(599, null, "x").isServerError).toBe(true);
    expect(new ApiError(404, null, "x").isServerError).toBe(false);
    expect(new ApiError(600, null, "x").isServerError).toBe(false);
  });
});
