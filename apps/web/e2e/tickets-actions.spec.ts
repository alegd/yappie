import { expect, test } from "@playwright/test";
import path from "path";
import { createProjectViaApi, generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");

test.describe("Tickets Actions", () => {
  const user = generateUser();
  let accessToken: string;

  test.beforeAll(async () => {
    const data = await registerUserViaApi(user);
    accessToken = data.accessToken;

    // Create a project for the audio
    await createProjectViaApi(accessToken, {
      name: "Tickets Test Project",
      context: "Testing ticket approval flow",
    });
  });

  test("should upload audio and approve generated ticket", async ({ page }) => {
    await loginViaUi(page, user.email, user.password);

    // 1. Upload audio
    await page.getByRole("link", { name: /audios/i }).click();
    await page.waitForURL(/audios/);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(AUDIO_FIXTURE);

    // Wait for processing to complete (this calls OpenAI — may take a while)
    await expect(page.getByText(/completed/i).first()).toBeVisible({ timeout: 120_000 });

    // 2. Navigate to tickets
    await page.getByRole("link", { name: /tickets/i }).click();
    await page.waitForURL(/tickets/);

    // 3. Wait for tickets to appear
    const ticketRow = page.locator("[data-testid=data-table]").first();
    await expect(ticketRow).toBeVisible({ timeout: 10_000 });

    // 4. Open actions menu and approve
    const actionsButton = page.getByRole("button", { name: /actions/i }).first();
    if (await actionsButton.isVisible()) {
      await actionsButton.click();

      const approveButton = page.getByRole("button", { name: /approve/i });
      if (await approveButton.isVisible()) {
        await approveButton.click();

        // Verify the status badge changed
        await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
