import type { NextConfig } from "next";

/**
 * Playwright ≥1.60 loads browsers.json via require(path.join(packageRoot, ...)),
 * which NFT cannot statically trace. Without this include, Netlify/Vercel
 * functions fail at import with:
 *   Cannot find module '.../playwright-core/browsers.json'
 *   Require stack: .../playwright-core/lib/coreBundle.js
 * This does not install Chromium; it only ships the package asset.
 */
const playwrightCoreAssets = [
  "./node_modules/playwright-core/browsers.json",
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Escape [id] — picomatch treats bare [id] as a character class, so the
  // include never matches App Router dynamic segments.
  outputFileTracingIncludes: {
    "/api/audit/run": [...playwrightCoreAssets],
    "/api/report/\\[id\\]/pdf": [...playwrightCoreAssets],
    "/api/report/\\[id\\]/png": [...playwrightCoreAssets],
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
