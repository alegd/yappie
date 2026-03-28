import { Inject, Injectable, HttpException, HttpStatus } from "@nestjs/common";
import type Redis from "ioredis";
import * as crypto from "crypto";
import { REDIS_CLIENT } from "../redis/redis.constants.js";

interface OtpData {
  code: string;
  attempts: number;
  verified?: boolean;
}

const OTP_TTL = 600;
const VERIFIED_TTL = 300;
const COOLDOWN_TTL = 60;
const RATE_WINDOW_TTL = 3600;
const MAX_ATTEMPTS = 3;
const MAX_RATE = 5;

@Injectable()
export class OtpService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generateAndStore(email: string): Promise<string> {
    const cooldownKey = `otp:cooldown:${email}`;
    const rateKey = `otp:rate:${email}`;
    const otpKey = `otp:${email}`;

    const hasCooldown = await this.redis.exists(cooldownKey);
    if (hasCooldown) {
      throw new HttpException(
        "Please wait before requesting a new code",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rateCount = await this.redis.incr(rateKey);
    if (rateCount === 1) {
      await this.redis.expire(rateKey, RATE_WINDOW_TTL);
    }
    if (rateCount > MAX_RATE) {
      throw new HttpException(
        "Too many OTP requests. Try again later",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = crypto.randomInt(0, 10000).toString().padStart(4, "0");
    const data: OtpData = { code, attempts: 0 };

    await this.redis.set(otpKey, JSON.stringify(data), "EX", OTP_TTL);
    await this.redis.set(cooldownKey, "1", "EX", COOLDOWN_TTL);

    return code;
  }

  async verify(email: string, code: string): Promise<boolean> {
    const otpKey = `otp:${email}`;
    const raw = await this.redis.get(otpKey);

    if (!raw) return false;

    const data: OtpData = JSON.parse(raw) as OtpData;

    const storedBuf = Buffer.from(data.code);
    const inputBuf = Buffer.from(code.padStart(data.code.length, "0").slice(0, data.code.length));

    const isMatch =
      storedBuf.length === inputBuf.length && crypto.timingSafeEqual(storedBuf, inputBuf);

    if (isMatch) {
      return true;
    }

    data.attempts += 1;

    if (data.attempts >= MAX_ATTEMPTS) {
      await this.redis.del(otpKey);
    } else {
      await this.redis.set(otpKey, JSON.stringify(data), "KEEPTTL");
    }

    return false;
  }

  async markVerified(email: string): Promise<void> {
    const otpKey = `otp:${email}`;
    const raw = await this.redis.get(otpKey);

    if (!raw) return;

    const data: OtpData = JSON.parse(raw) as OtpData;
    data.verified = true;

    await this.redis.set(otpKey, JSON.stringify(data), "EX", VERIFIED_TTL);
  }

  async isVerified(email: string, code: string): Promise<boolean> {
    const otpKey = `otp:${email}`;
    const raw = await this.redis.get(otpKey);

    if (!raw) return false;

    const data: OtpData = JSON.parse(raw) as OtpData;

    if (!data.verified) return false;

    const storedBuf = Buffer.from(data.code);
    const inputBuf = Buffer.from(code.padStart(data.code.length, "0").slice(0, data.code.length));

    return storedBuf.length === inputBuf.length && crypto.timingSafeEqual(storedBuf, inputBuf);
  }

  async delete(email: string): Promise<void> {
    const otpKey = `otp:${email}`;
    await this.redis.del(otpKey);
  }
}
