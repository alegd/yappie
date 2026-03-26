import { describe, expect, it } from "vitest";
import { createServerAction, ServerActionError } from "./server-action";

describe("ServerActionError", () => {
  it("should create error with message and statusCode", () => {
    const error = new ServerActionError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ServerActionError");
  });

  it("should default to 500 statusCode", () => {
    const error = new ServerActionError("fail");
    expect(error.statusCode).toBe(500);
  });
});

describe("createServerAction", () => {
  it("should return the value on success", async () => {
    const action = createServerAction(async (x: number) => x * 2);
    const result = await action(5);
    expect(result).toBe(10);
  });

  it("should catch ServerActionError and return error object", async () => {
    const action = createServerAction(async () => {
      throw new ServerActionError("bad request", 400);
    });
    const result = await action();
    expect(result).toEqual({ success: false, error: "bad request", statusCode: 400 });
  });

  it("should rethrow non-ServerActionError errors", async () => {
    const action = createServerAction(async () => {
      throw new Error("unexpected");
    });
    await expect(action()).rejects.toThrow("unexpected");
  });
});
