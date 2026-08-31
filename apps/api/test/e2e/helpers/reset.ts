import { INestApplication } from "@nestjs/common";
import type { Redis } from "ioredis";
import { PrismaService } from "../../../src/prisma/prisma.service.js";
import { REDIS_CLIENT } from "../../../src/redis/redis.constants.js";

export async function resetE2e(app: INestApplication): Promise<void> {
  if (process.env.NODE_ENV !== "test" || !/e2e/i.test(process.env.DB_NAME ?? "")) {
    throw new Error(
      `resetE2e refused: unsafe target (NODE_ENV=${process.env.NODE_ENV}, DB_NAME=${process.env.DB_NAME}). Expected NODE_ENV=test and an e2e database.`,
    );
  }
  const prisma = app.get(PrismaService);
  const redis = app.get<Redis>(REDIS_CLIENT);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  await redis.flushdb();
}
