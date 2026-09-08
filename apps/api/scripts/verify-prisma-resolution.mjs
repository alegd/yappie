#!/usr/bin/env node

const EXPECTED_MODELS = ["User", "Project", "Ticket"];
const EXPECTED_PLAN_VALUES = { FREE: "FREE", PRO: "PRO" };

function assertGeneratedModels(dmmf) {
  const generatedModelNames = dmmf?.datamodel?.models?.map((model) => model.name) ?? [];

  const missingModels = EXPECTED_MODELS.filter(
    (modelName) => !generatedModelNames.includes(modelName),
  );

  if (missingModels.length > 0) {
    throw new Error(
      `Generated Prisma client is missing expected model(s): ${missingModels.join(", ")}`,
    );
  }
}

function assertGeneratedEnum(Plan) {
  const isPlanEnumValid =
    Plan?.FREE === EXPECTED_PLAN_VALUES.FREE && Plan?.PRO === EXPECTED_PLAN_VALUES.PRO;

  if (!isPlanEnumValid) {
    throw new Error(
      `Generated Prisma client is missing the expected "Plan" enum values: ${JSON.stringify(EXPECTED_PLAN_VALUES)}`,
    );
  }
}

async function verifyPrismaResolution() {
  try {
    const { PrismaClient, Prisma, Plan } = await import("@prisma/client");

    if (typeof PrismaClient !== "function") {
      throw new TypeError("PrismaClient export is not a function");
    }

    assertGeneratedModels(Prisma.dmmf);
    assertGeneratedEnum(Plan);

    console.log("✔ @prisma/client resolves and was generated from the current schema under plain Node");
    return 0;
  } catch (error) {
    console.error("✘ @prisma/client failed to resolve under plain Node");
    console.error(error);
    console.error(
      'Check that the "generator client" block in apps/api/prisma/schema.prisma has no custom "output" path pointing outside the pnpm store resolution chain, then re-run "pnpm exec prisma generate".',
    );
    return 1;
  }
}

const exitCode = await verifyPrismaResolution();
process.exit(exitCode);
