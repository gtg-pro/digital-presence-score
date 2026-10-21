import { expect, test } from "@playwright/test";

test.describe("accessibility and responsive smoke", () => {
  test("homepage has landmark structure and keyboard-focusable CTA", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").first()).toBeVisible();
    await expect(page.locator("main, #main-content, [role='main']").first()).toBeVisible();
    const cta = page.getByRole("link", { name: /get free report card/i }).first();
    await cta.focus();
    await expect(cta).toBeFocused();
  });

  test("audit form labels are associated", async ({ page }) => {
    await page.goto("/audit");
    const url = page.getByLabel(/website url/i);
    await expect(url).toBeVisible();
    await page.locator("#agreeToTerms").focus();
    await expect(page.locator("#agreeToTerms")).toBeFocused();
  });

  test("progress page exposes live region status", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "status region checked once",
    );
    await page.goto("/audit/progress?demo=1");
    await expect(page.getByRole("status").first()).toBeVisible();
  });

  test("demo report headings are semantic", async ({ page }) => {
    await page.goto("/report/demo-complete");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // In-report Sample Report badge (not the site nav link).
    await expect(
      page.locator("#main-content").getByText("Sample Report", { exact: true }),
    ).toBeVisible();
  });

  test("mobile viewport does not horizontally overflow homepage", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "mobile overflow check",
    );
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});
