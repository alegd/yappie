import { defineConfig, devices } from "@playwright/test";
import { assertE2eTarget } from "./e2e/guard";

assertE2eTarget(process.env);

const WEB_PORT = 3100;

const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined),
) as Record<string, string>;
const API_URL = `http://localhost:${process.env.PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/guard.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  timeout: 60_000,

  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "pnpm start:e2e",
      cwd: "../api",
      env: { FRONTEND_URL: WEB_URL },
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm build && pnpm start",
      cwd: ".",
      url: WEB_URL,
      env: {
        ...inheritedEnv,
        AUTH_TRUST_HOST: "true",
        NODE_ENV: "production",
        PORT: String(WEB_PORT),
        NEXT_PUBLIC_API_URL: API_URL,
        NEXT_PUBLIC_HOST_URL: WEB_URL,
      },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
