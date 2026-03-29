import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException, HttpStatus } from "@nestjs/common";
import { OtpService } from "./otp.service.js";

function createMockRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    exists: vi.fn(),
  };
}

describe("OtpService", () => {
  let otpService: OtpService;
  let mockRedis: ReturnType<typeof createMockRedis>;

  const email = "test@example.com";
  const otpKey = `otp:${email}`;
  const cooldownKey = `otp:cooldown:${email}`;

  beforeEach(() => {
    mockRedis = createMockRedis();
    otpService = new OtpService(mockRedis as never);
  });

  describe("generateAndStore", () => {
    it("should store OTP with 600s TTL and return a 4-char code", async () => {
      mockRedis.exists.mockResolvedValue(0); // no cooldown
      mockRedis.incr.mockResolvedValue(1); // rate count = 1
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.expire.mockResolvedValue(1);

      const code = await otpService.generateAndStore(email);

      expect(code).toHaveLength(4);
      expect(/^\d{4}$/.test(code)).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(otpKey, expect.any(String), "EX", 600);
    });

    it("should throw HttpException 429 if cooldown is active", async () => {
      mockRedis.exists.mockResolvedValue(1); // cooldown active

      await expect(otpService.generateAndStore(email)).rejects.toThrow(
        new HttpException("Please wait before requesting a new code", HttpStatus.TOO_MANY_REQUESTS),
      );
    });

    it("should throw HttpException 429 if rate limit exceeded (>5 per hour)", async () => {
      mockRedis.exists.mockResolvedValue(0); // no cooldown
      mockRedis.incr.mockResolvedValue(6); // 6th request this hour

      await expect(otpService.generateAndStore(email)).rejects.toThrow(
        new HttpException("Too many OTP requests. Try again later", HttpStatus.TOO_MANY_REQUESTS),
      );
    });

    it("should set cooldown after generating a code", async () => {
      mockRedis.exists.mockResolvedValue(0);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.expire.mockResolvedValue(1);

      await otpService.generateAndStore(email);

      expect(mockRedis.set).toHaveBeenCalledWith(cooldownKey, "1", "EX", 60);
    });
  });

  describe("verify", () => {
    it("should return true for a valid code", async () => {
      const stored = JSON.stringify({ code: "1234", attempts: 0 });
      mockRedis.get.mockResolvedValue(stored);
      mockRedis.set.mockResolvedValue("OK");

      const result = await otpService.verify(email, "1234");

      expect(result).toBe(true);
    });

    it("should return false and increment attempts for an invalid code", async () => {
      const stored = JSON.stringify({ code: "1234", attempts: 0 });
      mockRedis.get.mockResolvedValue(stored);
      mockRedis.set.mockResolvedValue("OK");

      const result = await otpService.verify(email, "9999");

      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith(
        otpKey,
        JSON.stringify({ code: "1234", attempts: 1 }),
        "KEEPTTL",
      );
    });

    it("should delete OTP after 3 failed attempts", async () => {
      const stored = JSON.stringify({ code: "1234", attempts: 2 });
      mockRedis.get.mockResolvedValue(stored);
      mockRedis.del.mockResolvedValue(1);

      const result = await otpService.verify(email, "9999");

      expect(result).toBe(false);
      expect(mockRedis.del).toHaveBeenCalledWith(otpKey);
    });

    it("should return false if no OTP exists", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await otpService.verify(email, "1234");

      expect(result).toBe(false);
    });
  });

  describe("markVerified", () => {
    it("should set verified flag and reset TTL to 300s", async () => {
      const stored = JSON.stringify({ code: "1234", attempts: 0 });
      mockRedis.get.mockResolvedValue(stored);
      mockRedis.set.mockResolvedValue("OK");

      await otpService.markVerified(email);

      expect(mockRedis.set).toHaveBeenCalledWith(
        otpKey,
        JSON.stringify({ code: "1234", attempts: 0, verified: true }),
        "EX",
        300,
      );
    });
  });

  describe("isVerified", () => {
    it("should return true if verified flag is set and code matches", async () => {
      const stored = JSON.stringify({
        code: "1234",
        attempts: 0,
        verified: true,
      });
      mockRedis.get.mockResolvedValue(stored);

      const result = await otpService.isVerified(email, "1234");

      expect(result).toBe(true);
    });

    it("should return false if not verified", async () => {
      const stored = JSON.stringify({ code: "1234", attempts: 0 });
      mockRedis.get.mockResolvedValue(stored);

      const result = await otpService.isVerified(email, "1234");

      expect(result).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete the OTP key", async () => {
      mockRedis.del.mockResolvedValue(1);

      await otpService.delete(email);

      expect(mockRedis.del).toHaveBeenCalledWith(otpKey);
    });
  });
});
