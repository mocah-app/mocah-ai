import { test, expect } from "@playwright/test";

test.describe("Application Health", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    // Verify the page loads without errors
    await expect(page).toHaveTitle(/Mocah/i);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    // Verify login page elements are present
    await expect(page.locator("form")).toBeVisible();
  });
});

// TODO: Add more E2E tests in Phase 4
// - Authentication flow tests
// - Template creation/editing tests
// - Subscription flow tests
// - Library browsing tests

