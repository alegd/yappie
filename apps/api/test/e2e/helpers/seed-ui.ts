import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";

export const E2E_UI_EMAIL = "e2e-ui@example.com";
export const E2E_UI_USER_NAME = "E2E UI User";
export const E2E_UI_PROJECT_NAME = "E2E Project";

function hasNonDefaultRedisDbIndex(redisUrl: string | undefined): boolean {
  if (!redisUrl) return false;
  const match = /\/(\d+)\/?$/.exec(redisUrl);
  if (!match) return false;
  return Number(match[1]) !== 0;
}

export async function seedUiE2e(
  prisma: PrismaClient,
  redis: Redis,
): Promise<{ userId: string; projectId: string }> {
  if (
    process.env.NODE_ENV !== "test" ||
    !/e2e/i.test(process.env.DB_NAME ?? "") ||
    !hasNonDefaultRedisDbIndex(process.env.REDIS_URL)
  ) {
    throw new Error(
      `seedUiE2e refused: unsafe target (NODE_ENV=${process.env.NODE_ENV}, DB_NAME=${process.env.DB_NAME}, REDIS_URL=${process.env.REDIS_URL}). Expected NODE_ENV=test, an e2e database, and a REDIS_URL with a non-zero database index.`,
    );
  }
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  await redis.flushdb();
  const user = await prisma.user.create({
    data: { email: E2E_UI_EMAIL, name: E2E_UI_USER_NAME },
  });
  const project = await prisma.project.create({
    data: { name: E2E_UI_PROJECT_NAME, userId: user.id },
  });
  return { userId: user.id, projectId: project.id };
}
