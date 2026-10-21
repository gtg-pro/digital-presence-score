import { expect, test, type Page } from "@playwright/test";

async function submitAuditForm(page: Page, websiteUrl: string) {
  await page.goto("/audit");
  await page.getByLabel(/website url/i).fill(websiteUrl);
  await page.locator("#agreeToTerms").check();
  await page.getByRole("button", { name: /start my assessment/i }).click();
  await expect(page).toHaveURL(/\/audit\/progress/);
}

async function waitForLiveReport(page: Page) {
  await page.waitForURL(/\/report\/live-/, { timeout: 90_000 });
  await expect(
    page.getByText(/live assessment result held in a short-lived encrypted/i),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test.describe("Prompt 23 end-to-end audit journey", () => {
  test("homepage submit must POST /api/audit/run exactly once and leave Pending", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Stream init regression on desktop",
    );

    const auditPosts: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/audit/run")
      ) {
        auditPosts.push(request.url());
      }
    });

    const firstAuditPost = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/audit/run"),
      { timeout: 30_000 },
    );

    await page.goto("/");
    await page.getByPlaceholder(/example-service/i).fill("https://example.com");
    await page.getByRole("button", { name: /get my free report/i }).click();
    await expect(page).toHaveURL(/\/audit\/progress/);

    await firstAuditPost;

    // Fixture audits can finish and hard-navigate before stage DOM is asserted.
    await Promise.race([
      page.waitForURL(/\/report\/live-/, { timeout: 60_000 }),
      page
        .locator(
          '[data-stage-id="business-discovery"]:not([data-stage-status="pending"])',
        )
        .waitFor({ state: "visible", timeout: 60_000 }),
    ]);

    // Production webServer (no Strict Mode double-invoke): exactly one audit POST.
    expect(auditPosts.length).toBe(1);

    if (page.url().includes("/audit/progress")) {
      await expect(
        page.locator("[data-audit-pending-session='yes']"),
      ).toBeVisible();
      await expect(
        page.locator("[data-audit-fetch-initiated='yes']"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /audit session missing/i }),
      ).toHaveCount(0);
    } else {
      await expect(page).toHaveURL(/\/report\/live-/);
    }
  });

  test("homepage URL → progress → live report → PDF/PNG", async ({
    page,
  }, testInfo) => {
    // Full UI journey only on desktop project to keep CI time bounded.
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Full journey runs on desktop project",
    );

    await page.goto("/");
    await page.getByPlaceholder(/example-service/i).fill("https://example.com");
    await page.getByRole("button", { name: /get my free report/i }).click();
    await expect(page).toHaveURL(/\/audit\/progress/);

    await expect(page.getByText(/validating|crawling|assessment/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await waitForLiveReport(page);

    const url = page.url();
    expect(url).toMatch(/\/report\/live-/);
    expect(url).not.toContain("demo");

    // In-report demo badges must not appear (nav may still link to Sample Report).
    await expect(
      page.locator("#main-content").getByText("Sample Report", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator("#main-content").getByText("Demo Report", { exact: true }),
    ).toHaveCount(0);

    const reportId = new URL(page.url()).pathname.split("/").pop()!;
    expect(reportId.startsWith("live-")).toBeTruthy();

    // Use APIRequest (shares page cookies) — more reliable than intercepting
    // attachment downloads for binary magic-byte checks.
    const pdfResponse = await page.request.get(`/api/report/${reportId}/pdf`);
    expect(pdfResponse.ok()).toBeTruthy();
    const pdfBuffer = Buffer.from(await pdfResponse.body());
    expect(pdfBuffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdfResponse.headers()["cache-control"] ?? "").toMatch(/no-store/i);

    const pngResponse = await page.request.get(`/api/report/${reportId}/png`);
    expect(pngResponse.ok()).toBeTruthy();
    const pngBuffer = Buffer.from(await pngResponse.body());
    expect(pngBuffer.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );

    await expect(page.getByRole("button", { name: /download pdf/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /download png/i })).toBeEnabled();
  });

  test("audit form submission reaches live report", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Form path covered on desktop",
    );

    await submitAuditForm(page, "https://example.com");
    await waitForLiveReport(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("invalid URL shows validation without starting audit", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop only");
    await page.goto("/audit");
    await page.getByLabel(/website url/i).fill("not a url");
    await page.locator("#agreeToTerms").check();
    await page.getByRole("button", { name: /start my assessment/i }).click();
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.locator("#websiteUrl-error")).toBeVisible();
    await expect(page.locator("#websiteUrl-error")).toContainText(/valid website url/i);
  });

  test("PARTIAL and LIMITED fixtures complete via SSE API", async ({
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "API outcome checks on desktop worker",
    );

    for (const kind of ["partial", "limited"] as const) {
      // Body supplies inputs — do not start a competing UI audit (concurrency).
      const response = await request.post("/api/audit/run", {
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          "x-audit-e2e-fixture": kind,
        },
        data: {
          websiteUrl: "https://example.com",
          entryMode: "url",
        },
      });
      expect(response.ok()).toBeTruthy();
      const body = await response.text();
      expect(body).toContain('"type":"progress"');
      expect(body).toContain('"type":"complete"');
      if (kind === "partial") {
        expect(body).toContain('"status":"PARTIAL"');
      } else {
        expect(body).toContain('"status":"LIMITED_VISIBILITY"');
      }
      // Ignore sealed handoff ciphertext (base64url may contain "sk-" by chance).
      const progressBlob = body.replace(
        /"sealedHandoff":"[^"]*"/g,
        '"sealedHandoff":"[redacted]"',
      );
      expect(progressBlob).not.toMatch(/sk-[a-zA-Z0-9]/g);
      expect(progressBlob).not.toMatch(/OPENAI_API_KEY|REPORT_SESSION_SECRET/i);
    }
  });

  test("guessed live report id does not reveal another session", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop only");
    await page.goto("/report/live-does-not-exist-abcdef");
    await expect(
      page.getByRole("heading", { name: /live report unavailable/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/missing, expired, or could not be verified/i),
    ).toBeVisible();
    await expect(page.getByText(/demo fixture data is intentionally not shown/i)).toBeVisible();
  });

  test("admin dashboard routes are gone", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop only");
    const response = await page.goto("/admin");
    expect(response?.status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByText(/super admin|demo admin/i)).toHaveCount(0);
  });

  test("sample report remains clearly illustrative", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop only");
    await page.goto("/#sample-report");
    await expect(page.getByText(/sample report/i).first()).toBeVisible();
    await expect(
      page.getByText(/illustrative|not a verified assessment/i).first(),
    ).toBeVisible();
  });
});
