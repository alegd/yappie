import { expect, test } from "@playwright/test";
import { generateUser, loginViaUi, registerUserViaApi } from "./helpers";

test.describe("Projects CRUD", () => {
  const user = generateUser();

  test.beforeAll(async () => {
    await registerUserViaApi(user);
  });

  test("should create, edit, and delete a project", async ({ page }) => {
    await loginViaUi(page, user.email, user.password);

    // Navigate to projects
    await page.getByRole("link", { name: /projects/i }).click();
    await page.waitForURL(/projects/);

    // 1. Create project
    await page.getByRole("button", { name: /new project/i }).click();
    await page.waitForURL(/projects\/new/);

    await page.getByLabel(/name/i).fill("My E2E Project");
    await page.getByLabel(/description/i).fill("Testing CRUD operations");

    const contextField = page.getByLabel(/context/i);
    if (await contextField.isVisible()) {
      await contextField.fill("React + NestJS e-commerce app");
    }

    await page.getByRole("button", { name: /create|save/i }).click();
    await page.waitForURL(/projects/);

    await expect(page.getByText("My E2E Project")).toBeVisible();

    // 2. Edit project
    await page.getByText("My E2E Project").click();
    await page.waitForURL(/projects\/.*\/edit/);

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill("Renamed Project");
    await page.getByRole("button", { name: /save|update/i }).click();

    await page.waitForURL(/projects/);
    await expect(page.getByText("Renamed Project")).toBeVisible();

    // 3. Delete project
    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();

    // Handle confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    await expect(page.getByText("Renamed Project")).not.toBeVisible({ timeout: 5_000 });
  });
});
