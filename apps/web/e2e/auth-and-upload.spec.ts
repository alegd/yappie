import { expect, test } from "@playwright/test";
import path from "path";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");

test.describe("Auth and Upload Flow", () => {
  const user = generateUser();

  test("should register, login, create project, and upload audio", async ({ page }) => {
    // 1. Register via API (faster)
    await registerUserViaApi(user);

    // 2. Login via UI
    await loginViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/audios/);

    // 3. Create a project
    await page.getByRole("link", { name: /projects/i }).click();
    await page.waitForURL(/projects/);

    await page.getByRole("button", { name: /new project/i }).click();
    await page.waitForURL(/projects\/new/);

    await page.getByLabel(/name/i).fill("E2E Test Project");
    await page.getByLabel(/description/i).fill("A project for E2E testing");
    await page.getByRole("button", { name: /create|save/i }).click();

    await page.waitForURL(/projects/);
    await expect(page.getByText("E2E Test Project")).toBeVisible();

    // 4. Go to audios and upload
    await page.getByRole("link", { name: /audios/i }).click();
    await page.waitForURL(/audios/);

    // Upload audio file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(AUDIO_FIXTURE);

    // 5. Wait for the audio to appear in the list (processing takes time)
    await expect(page.getByText("test-audio.wav")).toBeVisible({ timeout: 10_000 });
  });
});
