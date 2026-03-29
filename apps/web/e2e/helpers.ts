import { Page } from "@playwright/test";
import Redis from "ioredis";

const API_URL = "http://localhost:3001/api/v1";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let userCounter = 0;

/** Generate unique user credentials for each test */
export function generateUser() {
  userCounter++;
  const timestamp = Date.now();
  return {
    name: `Test User ${userCounter}`,
    email: `e2e-${timestamp}-${userCounter}@test.com`,
  };
}

/** Read OTP code from Redis for a given email (retries until available) */
async function getOtpFromRedis(email: string, maxRetries = 10): Promise<string> {
  const redis = new Redis(REDIS_URL);
  try {
    for (let i = 0; i < maxRetries; i++) {
      const raw = await redis.get(`otp:${email}`);
      if (raw) {
        const data = JSON.parse(raw);
        return data.code;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`No OTP found in Redis for ${email} after ${maxRetries} retries`);
  } finally {
    await redis.quit();
  }
}

/** Clear all OTP rate limits in Redis for a given email */
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

/** Register a user via API using the OTP flow */
export async function registerUserViaApi(user: { name: string; email: string }) {
  await clearOtpLimits(user.email);

  // 1. Request OTP
  const otpRes = await fetch(`${API_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email }),
  });

  if (!otpRes.ok) {
    throw new Error(`Request OTP failed: ${otpRes.status} ${await otpRes.text()}`);
  }

  // 2. Read OTP from Redis
  const code = await getOtpFromRedis(user.email);

  // 3. Verify OTP (new user → isNewUser: true)
  const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, code }),
  });

  if (!verifyRes.ok) {
    throw new Error(`Verify OTP failed: ${verifyRes.status} ${await verifyRes.text()}`);
  }

  // 4. Complete registration
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

/** Login through the UI using the passwordless OTP flow */
export async function loginViaUi(page: Page, email: string) {
  // Clear Redis OTP limits (NestJS throttle is relaxed in test via NODE_ENV=test)
  await clearOtpLimits(email);

  await page.goto("/auth");

  // Step 1: Enter email and submit
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: Wait for OTP inputs to appear (confirms API processed the request)
  await page.locator('input[maxlength="1"]').first().waitFor({ timeout: 15_000 });

  // Step 3: Read OTP from Redis and enter digits
  const code = await getOtpFromRedis(email);
  const digits = code.split("");

  const otpInputs = page.locator('input[maxlength="1"]');
  for (let i = 0; i < digits.length; i++) {
    await otpInputs.nth(i).fill(digits[i]);
  }

  // Step 4: Wait for redirect to dashboard (auto-submits when all 4 digits filled)
  await page.waitForURL(/dashboard|audios/, { timeout: 15_000 });
}

/** Create a project via API */
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
