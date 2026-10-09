import { expect, test, type Page } from "@playwright/test";
import {
  createProjectViaApi,
  FAKE_TICKETS,
  generateUser,
  loginViaUi,
  registerUserViaApi,
  ticketDrawer,
  uploadFixtureAndWaitForTickets,
} from "./helpers";

const PROJECT_NAME = "Lifecycle Audit Project";
const PIPELINE_TIMEOUT_MS = 120_000;
const [FIRST_TICKET, SECOND_TICKET] = FAKE_TICKETS;
const EDITED_TITLE = "Add login button with SSO";

function sidebarProjectLink(page: Page) {
  return page.getByRole("complementary").getByRole("link", { name: PROJECT_NAME });
}

test.describe("Ticket lifecycle without Jira", () => {
  test.setTimeout(PIPELINE_TIMEOUT_MS + 120_000);

  const user = generateUser();

  test.beforeAll(async () => {
    const { accessToken } = await registerUserViaApi(user);
    await createProjectViaApi(accessToken, {
      name: PROJECT_NAME,
      context: "Auditing approve, edit and delete",
    });
  });

  test("approves drafts, edits a ticket, and deletes it", async ({ page }) => {
    await loginViaUi(page, user.email);

    await sidebarProjectLink(page).click();
    await page.waitForURL(/\/dashboard\/projects\/(?!new$)[a-z0-9]+$/);

    await uploadFixtureAndWaitForTickets(page);

    await expect(sidebarProjectLink(page)).toContainText("2");

    await page.getByLabel(`Select ${FIRST_TICKET}`).check();
    await page.getByLabel(`Select ${SECOND_TICKET}`).check();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Approve 2" }).click();

    await expect(page.getByText("APPROVED", { exact: true })).toHaveCount(2);
    await expect(sidebarProjectLink(page)).toHaveText(PROJECT_NAME);

    await page.getByRole("button", { name: FIRST_TICKET }).click();
    const drawer = ticketDrawer(page);
    await expect(drawer.getByRole("heading", { name: FIRST_TICKET })).toBeVisible();

    await drawer.getByRole("button", { name: "Edit", exact: true }).click();
    await drawer.getByLabel("Title").fill(EDITED_TITLE);
    await drawer.getByRole("button", { name: "Save", exact: true }).click();

    await expect(drawer.getByRole("heading", { name: EDITED_TITLE })).toBeVisible();

    await drawer.getByRole("button", { name: "Close drawer" }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("button", { name: EDITED_TITLE })).toBeVisible();

    await page.getByRole("button", { name: EDITED_TITLE }).click();
    await expect(drawer.getByRole("heading", { name: EDITED_TITLE })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await drawer.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(drawer).toBeHidden();
    await expect(page.getByRole("button", { name: EDITED_TITLE })).toHaveCount(0);
    await expect(page.getByText("1 tickets", { exact: true })).toBeVisible();
  });
});
