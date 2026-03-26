import { Page } from "@playwright/test";

const API_URL = "http://localhost:3001/api/v1";

let userCounter = 0;

/** Generate unique user credentials for each test */
export function generateUser() {
  userCounter++;
  const timestamp = Date.now();
  return {
    name: `Test User ${userCounter}`,
    email: `e2e-${timestamp}-${userCounter}@test.com`,
    password: "TestPass123!",
  };
}

/** Register a user via API (faster than going through UI) */
export async function registerUserViaApi(user: { name: string; email: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(`Register failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/** Login through the UI */
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard|audios/);
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
