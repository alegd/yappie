import { expect, test } from "@playwright/test";
import {
  createProjectViaApi,
  generateUser,
  loginViaUi,
  readAccountDeletionOtp,
  registerUserViaApi,
} from "./helpers";

const DELETE_ACCOUNT_PATH = "/dashboard/account/delete";
const CONFIRM_PHRASE = "DELETE";
const PROJECT_NAME = "Doomed Account Project";

test.describe("Account deletion", () => {
  const user = generateUser();
  let accessToken: string;

  test.beforeAll(async () => {
    ({ accessToken } = await registerUserViaApi(user));
    await createProjectViaApi(accessToken, { name: PROJECT_NAME });
  });

  test("deletes the account and erases its data, though the issued token still authenticates", async ({
    page,
    request,
  }) => {
    await loginViaUi(page, user.email);

    await page.goto("/dashboard/settings");
    await page.getByRole("tab", { name: "Danger zone" }).click();
    await page.getByRole("link", { name: "Delete account" }).click();
    await page.waitForURL(new RegExp(`${DELETE_ACCOUNT_PATH}$`));

    await expect(page.getByRole("main").getByText(user.email, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Send verification code" }).click();

    const code = await readAccountDeletionOtp(user.email);
    const digits = code.split("");
    for (let i = 0; i < digits.length; i++) {
      await page.getByLabel(`digit ${i + 1}`).fill(digits[i]);
    }

    await page.getByPlaceholder(`Type ${CONFIRM_PHRASE} to confirm`).fill(CONFIRM_PHRASE);
    await page.getByRole("button", { name: "Delete my account permanently" }).click();

    await page.waitForURL(/\/auth/);

    const projects = await request.get(`http://localhost:${process.env.PORT}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(projects.status()).toBe(200);
    expect((await projects.json()).data).toEqual([]);
  });
});
