import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { PrismaService } from "./prisma/prisma.service.js";
import { REDIS_CLIENT } from "./redis/redis.constants.js";

export interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    database: "up" | "down";
    redis: "up" | "down";
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getHealth(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const allUp = database === "up" && redis === "up";

    return {
      status: allUp ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: { database, redis },
    };
  }

  private async checkDatabase(): Promise<"up" | "down"> {
    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      return "up";
    } catch {
      return "down";
    }
  }

  private async checkRedis(): Promise<"up" | "down"> {
    try {
      const result = await this.redis.ping();
      return result === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }
}
