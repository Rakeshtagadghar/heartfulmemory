import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero and navigates Start CTA", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Turn family memories into a royal heirloom storybook."
      })
    ).toBeVisible();

    const startCta = page.getByRole("link", { name: "Start your Storybook" });
    await expect(startCta).toBeVisible();
    await startCta.click();

    await expect(page).toHaveURL(/\/login\?(.+&)?returnTo=%2Fapp%2Fstart/);
    await expect(page.getByRole("heading", { name: /continue to memorioso/i })).toBeVisible();
  });

  test("pricing CTA preserves plan query param", async ({ page }) => {
    await page.goto("/");
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    await page.getByRole("link", { name: "Get Digital" }).click();

    await expect(page).toHaveURL(/\/checkout\?plan=digital$/);
    await expect(page.getByText('"plan": "digital"')).toBeVisible();
  });
});
