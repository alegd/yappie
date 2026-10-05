import { expect, test, type Page } from "@playwright/test";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const SETTINGS_PATH = "/dashboard/settings";
const FAKE_SITE_NAME = "e2e-site";
const DISCONNECTED_COPY = "Export tickets to Atlassian Jira";

async function openIntegrationsTab(page: Page) {
  await page.getByRole("tab", { name: "Integrations" }).click();
}

test.describe("Jira connection", () => {
  const user = generateUser();

  test.beforeAll(async () => {
    await registerUserViaApi(user);
  });

  test("connects through the OAuth callback and disconnects again", async ({ page }) => {
    await loginViaUi(page, user.email);

    await page.goto(SETTINGS_PATH);
    await openIntegrationsTab(page);
    await expect(page.getByText(DISCONNECTED_COPY)).toBeVisible();

    await page.getByRole("button", { name: "Connect Jira" }).click();

    await page.waitForURL(/jira=connected/);
    await openIntegrationsTab(page);
    await expect(page.getByText(`Connected to ${FAKE_SITE_NAME}`)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Disconnect Jira" }).click();

    await expect(page.getByText(DISCONNECTED_COPY)).toBeVisible();
  });
});
