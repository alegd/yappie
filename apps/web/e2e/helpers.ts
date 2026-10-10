import { expect, Page } from "@playwright/test";
import path from "path";
import Redis from "ioredis";

const API_PORT = process.env.PORT;
const REDIS_URL = process.env.REDIS_URL;

if (!API_PORT || !REDIS_URL) {
  throw new Error(
    `Web e2e helpers need PORT and REDIS_URL (got PORT=${API_PORT}, REDIS_URL=${REDIS_URL}). ` +
      `Run through "pnpm e2e:web", which loads apps/api/.env.e2e.`,
  );
}

const API_URL = `http://localhost:${API_PORT}/api/v1`;
const OTP_POLL_ATTEMPTS = 10;
const OTP_POLL_INTERVAL_MS = 500;

let userCounter = 0;

export function generateUser() {
  userCounter++;
  const timestamp = Date.now();
  return {
    name: `Test User ${userCounter}`,
    email: `e2e-${timestamp}-${userCounter}@test.com`,
  };
}

async function readOtp(email: string, purpose?: string): Promise<string> {
  const purposeParam = purpose ? `&purpose=${encodeURIComponent(purpose)}` : "";
  const endpoint = `${API_URL}/auth/_test/last-otp?email=${encodeURIComponent(email)}${purposeParam}`;

  for (let attempt = 0; attempt < OTP_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(endpoint);
    if (response.ok) {
      const { code } = (await response.json()) as { code: string };
      return code;
    }
    await new Promise((resolve) => setTimeout(resolve, OTP_POLL_INTERVAL_MS));
  }

  throw new Error(
    `No OTP available for ${email} after ${OTP_POLL_ATTEMPTS} attempts against ${endpoint}. ` +
      `The endpoint 404s unless E2E_TEST_ENDPOINTS=true on the API.`,
  );
}

async function clearOtpLimits(email: string) {
  const redis = new Redis(REDIS_URL);
  try {
    await redis.del(`otp:cooldown:${email}`);
    await redis.del(`otp:rate:${email}`);
    await redis.del(`otp:${email}`);
  } finally {
    await redis.quit();
  }
}

export async function registerUserViaApi(user: { name: string; email: string }) {
  await clearOtpLimits(user.email);

  const otpRes = await fetch(`${API_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email }),
  });

  if (!otpRes.ok) {
    throw new Error(`Request OTP failed: ${otpRes.status} ${await otpRes.text()}`);
  }

  const code = await readOtp(user.email);

  const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, code }),
  });

  if (!verifyRes.ok) {
    throw new Error(`Verify OTP failed: ${verifyRes.status} ${await verifyRes.text()}`);
  }

  const registerRes = await fetch(`${API_URL}/auth/complete-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, code, name: user.name }),
  });

  if (!registerRes.ok) {
    throw new Error(`Complete register failed: ${registerRes.status} ${await registerRes.text()}`);
  }

  return registerRes.json();
}

export async function loginViaUi(page: Page, email: string) {
  await clearOtpLimits(email);

  await page.goto("/auth");

  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator('input[maxlength="1"]').first().waitFor({ timeout: 15_000 });

  const code = await readOtp(email);
  const digits = code.split("");

  const otpInputs = page.locator('input[maxlength="1"]');
  for (let i = 0; i < digits.length; i++) {
    await otpInputs.nth(i).fill(digits[i]);
  }

  await page.waitForURL(/dashboard|audios/, { timeout: 15_000 });
}

export async function createProjectViaApi(
  accessToken: string,
  data: { name: string; description?: string; context?: string },
) {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Create project failed: ${response.status}`);
  }

  return response.json();
}

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");
const PIPELINE_TIMEOUT_MS = 120_000;
const TICKET_APPEAR_TIMEOUT_MS = 15_000;

export const FAKE_TICKETS = ["Add login button", "Fix header layout"] as const;

export function ticketDrawer(page: Page) {
  return page
    .getByRole("dialog")
    .filter({ has: page.getByRole("button", { name: "Close drawer" }) });
}

export async function uploadFixtureAndWaitForTickets(page: Page) {
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Upload" }).click();
  await page.getByLabel("Audio file input").setInputFiles(AUDIO_FIXTURE);

  await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeHidden({
    timeout: PIPELINE_TIMEOUT_MS,
  });

  await expect(page.getByRole("button", { name: FAKE_TICKETS[0] })).toBeVisible({
    timeout: TICKET_APPEAR_TIMEOUT_MS,
  });
  await expect(page.getByRole("button", { name: FAKE_TICKETS[1] })).toBeVisible();
}

export async function connectJiraViaUi(page: Page) {
  await page.goto("/dashboard/settings");
  await page.getByRole("tab", { name: "Integrations" }).click();
  await page.getByRole("button", { name: "Connect Jira" }).click();
  await page.waitForURL(/jira=connected/);
}

export function readAccountDeletionOtp(email: string) {
  return readOtp(email, "account-deletion");
}
