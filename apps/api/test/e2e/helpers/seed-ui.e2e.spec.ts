import { beforeEach, describe, expect, it, vi } from "vitest";
import { E2E_UI_EMAIL, E2E_UI_PROJECT_NAME, seedUiE2e } from "./seed-ui.js";

function createMockPrisma() {
  return {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    user: { create: vi.fn().mockResolvedValue({ id: "user-1" }) },
    project: { create: vi.fn().mockResolvedValue({ id: "project-1" }) },
  };
}

function createMockRedis() {
  return {
    flushdb: vi.fn().mockResolvedValue("OK"),
  };
}

describe("seedUiE2e", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DB_NAME", "yappie_e2e");
  });

  it("refuses to run when NODE_ENV is not test", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(seedUiE2e(mockPrisma as never, mockRedis as never)).rejects.toThrow(
      /unsafe target/,
    );
    expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
    expect(mockRedis.flushdb).not.toHaveBeenCalled();
  });

  it("refuses to run when DB_NAME is not an e2e database", async () => {
    vi.stubEnv("DB_NAME", "yappie");

    await expect(seedUiE2e(mockPrisma as never, mockRedis as never)).rejects.toThrow(
      /unsafe target/,
    );
    expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
    expect(mockRedis.flushdb).not.toHaveBeenCalled();
  });

  it("truncates users, flushes redis, and seeds the ui user with one project", async () => {
    const result = await seedUiE2e(mockPrisma as never, mockRedis as never);

    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
    expect(mockRedis.flushdb).toHaveBeenCalledOnce();
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: E2E_UI_EMAIL, name: "E2E UI User" },
    });
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: { name: E2E_UI_PROJECT_NAME, userId: "user-1" },
    });
    expect(result).toEqual({ userId: "user-1", projectId: "project-1" });
  });
});
