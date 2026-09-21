import Redis from "ioredis";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { seedUiE2e } from "../test/e2e/helpers/seed-ui.js";

async function main(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("REDIS_URL environment variable is required");

  const prisma = new PrismaService();
  const redis = new Redis(redisUrl);
  try {
    const result = await seedUiE2e(prisma, redis);
    console.log(`seeded e2e ui fixtures: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
    redis.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
