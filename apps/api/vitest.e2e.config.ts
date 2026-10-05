import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/e2e/**/*.e2e.spec.ts"],
    env: { E2E_MOCK_JIRA: "true" },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
  },
});
