import { expect, test, type Page } from "@playwright/test";
import {
  createProjectViaApi,
  createTemplateViaApi,
  generateUser,
  loginViaUi,
  registerUserViaApi,
  uploadFixtureAndWaitForTickets,
} from "./helpers";

const PROJECT_NAME = "Read Views Project";
const TEMPLATE_NAME = "Bug report template";
const PIPELINE_TIMEOUT_MS = 120_000;
const PROJECT_DETAIL_URL = /\/dashboard\/projects\/(?!new$)[a-z0-9]+$/;
const USED_OVER_LIMIT = /^\d+ \/ \d+ min/;
const GENERATED_TICKETS = "2 tickets";

function sidebarProjectLink(page: Page) {
  return page.getByRole("complementary").getByRole("link", { name: PROJECT_NAME });
}

test.describe("Read views contract", () => {
  test.setTimeout(PIPELINE_TIMEOUT_MS + 180_000);

  const user = generateUser();

  test.beforeAll(async () => {
    const { accessToken } = await registerUserViaApi(user);
    await createProjectViaApi(accessToken, { name: PROJECT_NAME });
    await createTemplateViaApi(accessToken, {
      name: TEMPLATE_NAME,
      content: "Steps to reproduce:",
    });
  });

  test("home and settings render values the API actually produced", async ({ page }) => {
    await loginViaUi(page, user.email);

    await sidebarProjectLink(page).click();
    await page.waitForURL(PROJECT_DETAIL_URL);
    await uploadFixtureAndWaitForTickets(page);

    await page.goto("/dashboard");

    await expect(page.getByText("Recent activity")).toBeVisible();
    await expect(page.getByText(GENERATED_TICKETS)).toBeVisible();
    await expect(page.getByText("Nothing yet — record an audio to get started.")).toHaveCount(0);
    await expect(page.getByText(USED_OVER_LIMIT).first()).toBeVisible();

    await page.goto("/dashboard/settings");
    await expect(page.getByText("Plan & Usage")).toBeVisible();
    await expect(page.getByText(USED_OVER_LIMIT).first()).toBeVisible();

    await page.getByRole("tab", { name: "Integrations" }).click();
    await expect(page.getByText(TEMPLATE_NAME)).toBeVisible();
    await expect(page.getByText("No templates yet.")).toHaveCount(0);

    await page.getByRole("tab", { name: "Analytics" }).click();
    await expect(page.getByRole("paragraph").filter({ hasText: "Audios Uploaded" })).toBeVisible();
    await expect(page.getByText("No analytics data yet.")).toHaveCount(0);
  });
});
