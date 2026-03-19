import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Demo user
  const password = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@yappie.dev" },
    update: {},
    create: {
      email: "demo@yappie.dev",
      name: "Demo User",
      password,
    },
  });
  console.log(`  User: ${user.email} (password: demo1234)`);

  // Demo project
  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Yappie Demo Project",
      description: "A sample project for testing the audio-to-ticket pipeline",
      userId: user.id,
    },
  });
  console.log(`  Project: ${project.name}`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
