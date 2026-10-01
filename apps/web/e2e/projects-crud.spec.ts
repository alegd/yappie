import { expect, test } from "@playwright/test";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const ORIGINAL_NAME = "My E2E Project";
const RENAMED_NAME = "Renamed E2E Project";
const PROJECT_DETAIL_URL = /\/dashboard\/projects\/(?!new$)[a-z0-9]+$/;

test.describe("Projects", () => {
  const user = generateUser();

  test.beforeAll(async () => {
    await registerUserViaApi(user);
  });

  test("creates a project and renames it through the edit form", async ({ page }) => {
    await loginViaUi(page, user.email);

    await page.getByRole("link", { name: "New project" }).click();
    await page.waitForURL(/\/dashboard\/projects\/new$/);

    await page.getByLabel("Name", { exact: true }).fill(ORIGINAL_NAME);
    await page.getByLabel("Description", { exact: true }).fill("Testing create and edit");
    await page.getByRole("button", { name: "Create project" }).click();

    await page.waitForURL(PROJECT_DETAIL_URL);
    await expect(page.getByRole("heading", { name: ORIGINAL_NAME })).toBeVisible();

    await page.getByRole("link", { name: /edit context/i }).click();
    await page.waitForURL(/\/dashboard\/projects\/[a-z0-9]+\/edit$/);

    await page.getByLabel("Name", { exact: true }).fill(RENAMED_NAME);
    await page.getByRole("button", { name: "Save changes" }).click();

    await page.waitForURL(PROJECT_DETAIL_URL);
    await expect(page.getByRole("heading", { name: RENAMED_NAME })).toBeVisible();
    await expect(page.getByRole("link", { name: RENAMED_NAME })).toBeVisible();
    await expect(page.getByRole("link", { name: ORIGINAL_NAME })).toBeHidden();
  });
});
