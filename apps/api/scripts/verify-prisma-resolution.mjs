#!/usr/bin/env node

async function verifyPrismaResolution() {
  try {
    const { PrismaClient } = await import("@prisma/client");

    if (typeof PrismaClient !== "function") {
      throw new TypeError("PrismaClient export is not a function");
    }

    console.log("✔ @prisma/client resolves correctly under plain Node");
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
