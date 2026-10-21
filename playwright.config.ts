import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      ALLOW_AUDIT_E2E_FIXTURES: "1",
      AUDIT_E2E_FIXTURE: process.env.AUDIT_E2E_FIXTURE ?? "complete",
      AUDIT_SKIP_PAGESPEED: "1",
      AUDIT_SKIP_OPENAI: "1",
      // Plain HTTP webServer — Secure cookies would not round-trip reliably.
      COOKIE_SECURE: "0",
      // Cookie report sessions can exceed Node's default 16KB header budget.
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --max-http-header-size=65536`.trim(),
      REPORT_SESSION_SECRET:
        process.env.REPORT_SESSION_SECRET ??
        "e2e-report-session-secret-not-for-production",
    },
  },
});
