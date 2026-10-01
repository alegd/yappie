import { Page } from "@playwright/test";
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

async function readOtp(email: string): Promise<string> {
  const endpoint = `${API_URL}/auth/_test/last-otp?email=${encodeURIComponent(email)}`;

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
