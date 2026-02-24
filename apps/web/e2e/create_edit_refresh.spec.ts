import { expect, test } from "@playwright/test";

const sprint5Email = process.env.E2E_SPRINT5_EMAIL;

test.describe("Sprint 5 create -> edit -> refresh (Convex)", () => {
  test.skip(!sprint5Email, "Set E2E_SPRINT5_EMAIL to run Sprint 5 editor smoke flow.");

  test("creates blank book, adds chapter, edits text, refreshes", async ({ page }) => {
    await page.goto("/login?returnTo=%2Fapp");

    await page.getByLabel("Email address").fill(String(sprint5Email));
    await page.getByRole("button", { name: /continue to app/i }).click();

    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole("button", { name: "Quick Blank" }).click();
    await expect(page).toHaveURL(/\/app\/storybooks\/.+/);

    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.getByLabel("Active chapter")).toBeVisible();

    await page.getByRole("button", { name: /\+ Text Block/i }).click();
    await page.getByRole("textbox", { name: /rich text chapter content/i }).click();
    await page.keyboard.type("Sprint 5 smoke test memory.");

    await expect(page.getByText("Saved").first()).toBeVisible({ timeout: 5000 });

    await page.reload();

    await expect(page.getByText("Sprint 5 smoke test memory.")).toBeVisible();
  });
});

