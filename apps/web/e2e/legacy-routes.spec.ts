import { expect, test } from "@playwright/test";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

const LEGACY_ROUTES = ["/dashboard/audios", "/dashboard/projects", "/dashboard/tickets"];

test.describe("Legacy dashboard routes", () => {
  const user = generateUser();

  test.beforeAll(async () => {
    await registerUserViaApi(user);
  });

  test("redirects every legacy list route to the dashboard", async ({ page }) => {
    await loginViaUi(page, user.email);

    for (const route of LEGACY_ROUTES) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/dashboard$/);
    }
  });
});
