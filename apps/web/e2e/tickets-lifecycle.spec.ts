import { expect, test, type Page } from "@playwright/test";
import path from "path";
import { createProjectViaApi, generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const AUDIO_FIXTURE = path.join(__dirname, "fixtures/test-audio.wav");
const PROJECT_NAME = "Lifecycle Audit Project";
const PIPELINE_TIMEOUT_MS = 120_000;
const TICKET_APPEAR_TIMEOUT_MS = 15_000;
const FIRST_TICKET = "Add login button";
const SECOND_TICKET = "Fix header layout";
const EDITED_TITLE = "Add login button with SSO";

function sidebarProjectLink(page: Page) {
  return page.getByRole("complementary").getByRole("link", { name: PROJECT_NAME });
}

function ticketDrawer(page: Page) {
  return page
    .getByRole("dialog")
    .filter({ has: page.getByRole("button", { name: "Close drawer" }) });
}

async function uploadFixtureAndWaitForTickets(page: Page) {
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Upload" }).click();
  await page.getByLabel("Audio file input").setInputFiles(AUDIO_FIXTURE);

  await expect(page.getByRole("dialog", { name: "Record", exact: true })).toBeHidden({
    timeout: PIPELINE_TIMEOUT_MS,
  });

  await expect(page.getByRole("button", { name: FIRST_TICKET })).toBeVisible({
    timeout: TICKET_APPEAR_TIMEOUT_MS,
  });
  await expect(page.getByRole("button", { name: SECOND_TICKET })).toBeVisible();
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

    await expect(page.getByText("APPROVED")).toHaveCount(2);
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
