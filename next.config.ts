import type { NextConfig } from "next";

/**
 * Playwright ≥1.60 loads browsers.json via require(path.join(packageRoot, ...)),
 * which NFT cannot statically trace. Without this include, Netlify/Vercel
 * functions fail at import with:
 *   Cannot find module '.../playwright-core/browsers.json'
 *   Require stack: .../playwright-core/lib/coreBundle.js
 *
 * @sparticuz/chromium supplies a Linux Chromium binary for Netlify/Lambda.
 * Including browsers.json alone does NOT install a browser executable.
 */
const playwrightRuntimeAssets = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/@sparticuz/chromium/**",
] as const;

const nextConfig: NextConfig = {
  basePath: "/tools/digital-presence-score",
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@sparticuz/chromium", "playwright", "playwright-core"],
  // Escape [id] — picomatch treats bare [id] as a character class, so the
  // include never matches App Router dynamic segments.
  outputFileTracingIncludes: {
    "/api/audit/run": [...playwrightRuntimeAssets],
    "/api/report/\\[id\\]/pdf": [...playwrightRuntimeAssets],
    "/api/report/\\[id\\]/png": [...playwrightRuntimeAssets],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
