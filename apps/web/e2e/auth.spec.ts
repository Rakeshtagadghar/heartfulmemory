import { expect, test } from "@playwright/test";

test.describe("Auth / Protected Routes", () => {
  test("redirects unauthenticated /app access to /login with returnTo", async ({ page }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login\?(.+&)?returnTo=%2Fapp/);
    await expect(page.getByRole("heading", { name: /continue to memorioso/i })).toBeVisible();
  });
});
