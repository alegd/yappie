import { describe, it, expect, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { RedisModule } from "./redis.module.js";
import { REDIS_CLIENT } from "./redis.constants.js";

vi.mock("ioredis", () => {
  const RedisMock = function () {
    return { status: "ready", quit: vi.fn() };
  };
  return { default: RedisMock };
});

describe("RedisModule", () => {
  it("should provide REDIS_CLIENT", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    const module = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    const client = module.get(REDIS_CLIENT);
    expect(client).toBeDefined();
    expect(client.status).toBe("ready");

    await module.close();
  });
});
