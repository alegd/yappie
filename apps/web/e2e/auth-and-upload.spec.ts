import { expect, test } from "@playwright/test";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const PROJECT_NAME = "E2E Test Project";
const PROJECT_DETAIL_URL = /\/dashboard\/projects\/(?!new$)[a-z0-9]+$/;

test.describe("Auth and project creation", () => {
  const user = generateUser();

  test("registers, logs in, and creates a project from the sidebar", async ({ page }) => {
    await registerUserViaApi(user);

    await loginViaUi(page, user.email);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("link", { name: "New project" }).click();
    await page.waitForURL(/\/dashboard\/projects\/new$/);

    await page.getByLabel("Name", { exact: true }).fill(PROJECT_NAME);
    await page.getByLabel("Description", { exact: true }).fill("A project for E2E testing");
    await page.getByLabel(/AI Context/).fill("React frontend with a NestJS API.");

    await page.getByRole("button", { name: "Create project" }).click();
    await page.waitForURL(PROJECT_DETAIL_URL);

    await expect(page.getByRole("heading", { name: PROJECT_NAME })).toBeVisible();
    await expect(page.getByRole("link", { name: PROJECT_NAME })).toBeVisible();
  });
});
