import { PrismaClient } from "@prisma/client";
import { seedUiE2e } from "../test/e2e/helpers/seed-ui.js";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await seedUiE2e(prisma);
    console.log(`seeded e2e ui fixtures: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
