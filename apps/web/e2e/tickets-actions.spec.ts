import { expect, test } from "@playwright/test";
import path from "path";
import { createProjectViaApi, generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");
const PROJECT_NAME = "Tickets Test Project";
const PIPELINE_TIMEOUT_MS = 120_000;

test.describe("Tickets from a processed audio", () => {
  test.setTimeout(PIPELINE_TIMEOUT_MS + 60_000);

  const user = generateUser();

  test.beforeAll(async () => {
    const { accessToken } = await registerUserViaApi(user);
    await createProjectViaApi(accessToken, {
      name: PROJECT_NAME,
      context: "Testing the ticket pipeline",
    });
  });

  test("uploads an audio file, sees its tickets appear without a click, and opens one", async ({
    page,
  }) => {
    await loginViaUi(page, user.email);

    await page.getByRole("link", { name: PROJECT_NAME }).click();
    await page.waitForURL(/\/dashboard\/projects\/(?!new$)[a-z0-9]+$/);

    await page.getByRole("button", { name: "Record", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Upload" }).click();
    await page.getByLabel("Audio file input").setInputFiles(AUDIO_FIXTURE);

    await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeHidden({
      timeout: PIPELINE_TIMEOUT_MS,
    });

    await expect(page.getByRole("button", { name: /test-audio\.wav/ })).toBeVisible();

    await expect(page.getByRole("button", { name: "Add login button" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Fix header layout" })).toBeVisible();

    await expect(page.getByText("1 audios", { exact: true })).toBeVisible();
    await expect(page.getByText("2 tickets", { exact: true })).toBeVisible();
    await expect(page.getByText("0 exported", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add login button" }).click();
    await expect(page.getByRole("dialog", { name: "Ticket detail" })).toBeVisible();
  });
});
