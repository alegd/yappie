import type { PrismaClient } from "@prisma/client";

export const E2E_UI_EMAIL = "e2e-ui@example.com";
export const E2E_UI_USER_NAME = "E2E UI User";
export const E2E_UI_PROJECT_NAME = "E2E Project";

export async function seedUiE2e(
  prisma: PrismaClient,
): Promise<{ userId: string; projectId: string }> {
  if (process.env.NODE_ENV !== "test" || !/e2e/i.test(process.env.DB_NAME ?? "")) {
    throw new Error(
      `seedUiE2e refused: unsafe target (NODE_ENV=${process.env.NODE_ENV}, DB_NAME=${process.env.DB_NAME}). Expected NODE_ENV=test and an e2e database.`,
    );
  }
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  const user = await prisma.user.create({
    data: { email: E2E_UI_EMAIL, name: E2E_UI_USER_NAME },
  });
  const project = await prisma.project.create({
    data: { name: E2E_UI_PROJECT_NAME, userId: user.id },
  });
  return { userId: user.id, projectId: project.id };
}
