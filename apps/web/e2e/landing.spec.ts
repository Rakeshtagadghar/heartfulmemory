import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero and navigates Start CTA", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Turn family memories into a royal heirloom storybook."
      })
    ).toBeVisible();

    const startCta = page.getByRole("link", { name: "Start free" }).first();
    await expect(startCta).toBeVisible();
    await startCta.click();

    await expect(page).toHaveURL(/\/auth\/sign-in\?(.+&)?returnTo=%2Fcreate%2Ftemplate/);
    await expect(page.getByRole("heading", { name: /continue to memorioso/i })).toBeVisible();
  });

  test("pricing CTA routes unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/");
    const pricingSection = page.locator("#pricing");
    await pricingSection.scrollIntoViewIfNeeded();

    await pricingSection.getByRole("link", { name: "Upgrade to export" }).first().click();

    await expect(page).toHaveURL(/\/auth\/sign-in\?(.+&)?returnTo=%2Fapp/);
    await expect(page.getByRole("heading", { name: /continue to memorioso/i })).toBeVisible();
  });
});
