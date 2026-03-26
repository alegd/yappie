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
    // Register dialog handler BEFORE the action that triggers it
    page.once("dialog", (dialog) => dialog.accept());

    // Use the specific aria-label
    await page.getByRole("button", { name: /delete renamed project/i }).click();

    // Reload to see the updated list (SWR cache may delay)
    await page.waitForTimeout(1_000);
    await page.reload();
    await expect(page.getByText("Renamed Project")).toBeHidden({ timeout: 10_000 });
  });
});
