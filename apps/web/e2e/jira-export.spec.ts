import { expect, test, type Page } from "@playwright/test";
import {
  connectJiraViaUi,
  createProjectViaApi,
  FAKE_TICKETS,
  generateUser,
  loginViaUi,
  registerUserViaApi,
  ticketDrawer,
  uploadFixtureAndWaitForTickets,
} from "./helpers";

const PROJECT_NAME = "Export Audit Project";
const PIPELINE_TIMEOUT_MS = 120_000;
const JIRA_PROJECT_OPTION = "YAP — Yappie E2E";
const JIRA_KEY_PATTERN = /YAP-\d+/;
const PROJECT_DETAIL_URL = /\/dashboard\/projects\/(?!new$)[a-z0-9]+$/;
const [FIRST_TICKET, SECOND_TICKET] = FAKE_TICKETS;

function sidebarProjectLink(page: Page) {
  return page.getByRole("complementary").getByRole("link", { name: PROJECT_NAME });
}

async function linkProjectToJira(page: Page) {
  await page.getByRole("link", { name: /edit context/i }).click();
  await page.waitForURL(/\/dashboard\/projects\/[a-z0-9]+\/edit$/);

  await page.getByRole("combobox", { name: "Jira project" }).click();
  await page.getByRole("option", { name: JIRA_PROJECT_OPTION }).click();
  await page.getByRole("button", { name: "Save changes" }).click();

  await page.waitForURL(PROJECT_DETAIL_URL);
}

test.describe("Jira export", () => {
  test.setTimeout(PIPELINE_TIMEOUT_MS + 180_000);

  const user = generateUser();

  test.beforeAll(async () => {
    const { accessToken } = await registerUserViaApi(user);
    await createProjectViaApi(accessToken, {
      name: PROJECT_NAME,
      context: "Auditing single and bulk export",
    });
  });

  test("exports one ticket from the drawer and the rest from the bulk bar", async ({ page }) => {
    await loginViaUi(page, user.email);
    await connectJiraViaUi(page);

    await sidebarProjectLink(page).click();
    await page.waitForURL(PROJECT_DETAIL_URL);
    await linkProjectToJira(page);

    await uploadFixtureAndWaitForTickets(page);

    await page.getByLabel(`Select ${FIRST_TICKET}`).check();
    await page.getByLabel(`Select ${SECOND_TICKET}`).check();
    await page.getByRole("button", { name: "Approve 2" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toHaveCount(2);
    await expect(page.getByText("0 exported", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: FIRST_TICKET }).click();
    const drawer = ticketDrawer(page);
    await drawer.getByRole("button", { name: "Export to Jira" }).click();
    await expect(drawer.getByRole("link", { name: JIRA_KEY_PATTERN })).toBeVisible();

    await drawer.getByRole("button", { name: "Close drawer" }).click();
    await expect(drawer).toBeHidden();

    await expect(page.getByText("EXPORTED", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: JIRA_KEY_PATTERN })).toHaveCount(1);
    await expect(page.getByText("1 exported", { exact: true })).toBeVisible();

    await page.getByLabel(`Select ${SECOND_TICKET}`).check();
    await page.getByRole("button", { name: "Export 1" }).click();

    await expect(page.getByText("EXPORTED", { exact: true })).toHaveCount(2);
    await expect(page.getByRole("link", { name: JIRA_KEY_PATTERN })).toHaveCount(2);
    await expect(page.getByText("2 exported", { exact: true })).toBeVisible();
  });
});
