import { expect, test } from "@playwright/test";

test.describe("accessibility and responsive smoke", () => {
  test("homepage has landmark structure and keyboard-focusable CTA", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").first()).toBeVisible();
    await expect(page.locator("main, #main-content, [role='main']").first()).toBeVisible();
    const contact = page
      .getByRole("navigation", { name: /primary/i })
      .getByRole("link", { name: /^contact$/i });
    await contact.focus();
    await expect(contact).toBeFocused();
  });

  test("homepage audit URL field is labeled for assistive tech", async ({
    page,
  }) => {
    await page.goto("/");
    const url = page.getByLabel(/website url/i);
    await expect(url).toBeVisible();
    await url.focus();
    await expect(url).toBeFocused();
  });

  test("progress page exposes live region status", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "status region checked once",
    );
    await page.goto("/audit/progress?demo=1");
    await expect(page.getByRole("status").first()).toBeVisible();
  });

  test("landing sample report preview is present", async ({ page }) => {
    await page.goto("/#sample-report");
    await expect(
      page.locator("#sample-report").getByText("Sample Report", { exact: true }),
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
