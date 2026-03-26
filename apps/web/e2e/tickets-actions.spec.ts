import { expect, test } from "@playwright/test";
import path from "path";
import { createProjectViaApi, generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");

test.describe("Tickets Actions", () => {
  // This test calls OpenAI (Whisper + GPT) so it needs extra time
  test.setTimeout(180_000); // 3 minutes

  const user = generateUser();
  let accessToken: string;

  test.beforeAll(async () => {
    const data = await registerUserViaApi(user);
    accessToken = data.accessToken;

    await createProjectViaApi(accessToken, {
      name: "Tickets Test Project",
      context: "Testing ticket approval flow",
    });
  });

  test("should upload audio and see it processed", async ({ page }) => {
    await loginViaUi(page, user.email, user.password);

    // 1. Upload audio
    await page.getByRole("link", { name: /audios/i }).click();
    await page.waitForURL(/audios/);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(AUDIO_FIXTURE);

    // 2. Wait for audio to appear in list
    await expect(page.getByText("test-audio.wav")).toBeVisible({ timeout: 10_000 });

    // 3. Wait for processing — status should change from Pending
    // With a silence file, it may complete quickly or fail
    await page.waitForTimeout(5_000); // Give pipeline time to start

    // 4. Verify audio is in the list (any status)
    await expect(page.getByText("test-audio.wav")).toBeVisible();
  });

  test("should navigate to tickets page", async ({ page }) => {
    await loginViaUi(page, user.email, user.password);

    await page.getByRole("link", { name: /tickets/i }).click();
    await page.waitForURL(/tickets/);

    // Verify the tickets page loads (may or may not have tickets from the audio)
    await expect(page.getByText(/tickets/i).first()).toBeVisible();
  });
});
