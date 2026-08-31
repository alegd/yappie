import { NotFoundException } from "@nestjs/common";
import { E2eOtpController } from "./e2e-otp.controller.js";

function makeRedis(value: string | null) {
  return { get: async (_key: string) => value } as never;
}

describe("E2eOtpController", () => {
  const prev = process.env.E2E_TEST_ENDPOINTS;
  afterEach(() => {
    if (prev === undefined) {
      delete process.env.E2E_TEST_ENDPOINTS;
    } else {
      process.env.E2E_TEST_ENDPOINTS = prev;
    }
  });

  it("404s when the flag is off", async () => {
    process.env.E2E_TEST_ENDPOINTS = "false";
    const c = new E2eOtpController(makeRedis(JSON.stringify({ code: "1234", attempts: 0 })));
    await expect(c.lastOtp("a@b.com")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns the code when flag on and a code exists", async () => {
    process.env.E2E_TEST_ENDPOINTS = "true";
    const c = new E2eOtpController(makeRedis(JSON.stringify({ code: "1234", attempts: 0 })));
    await expect(c.lastOtp("a@b.com")).resolves.toEqual({ code: "1234" });
  });

  it("404s when flag on but no code stored", async () => {
    process.env.E2E_TEST_ENDPOINTS = "true";
    const c = new E2eOtpController(makeRedis(null));
    await expect(c.lastOtp("a@b.com")).rejects.toBeInstanceOf(NotFoundException);
  });
});
