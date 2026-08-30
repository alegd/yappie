import { Controller, Get, Inject, NotFoundException, Query } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants.js";
import { Public } from "./decorators/public.decorator.js";

@ApiExcludeController()
@Controller("auth/_test")
export class E2eOtpController {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  @Public()
  @Get("last-otp")
  async lastOtp(@Query("email") email?: string): Promise<{ code: string }> {
    if (process.env.E2E_TEST_ENDPOINTS !== "true" || !email) {
      throw new NotFoundException();
    }
    const raw = await this.redis.get(`otp:${email}`);
    if (!raw) {
      throw new NotFoundException();
    }
    const { code } = JSON.parse(raw) as { code: string };
    return { code };
  }
}
