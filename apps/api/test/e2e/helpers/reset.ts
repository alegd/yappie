import { INestApplication } from "@nestjs/common";
import type { Redis } from "ioredis";
import { PrismaService } from "../../../src/prisma/prisma.service.js";
import { REDIS_CLIENT } from "../../../src/redis/redis.constants.js";

export async function resetE2e(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const redis = app.get<Redis>(REDIS_CLIENT);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  await redis.flushdb();
}
