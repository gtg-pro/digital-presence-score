import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Pin NFT / standalone tracing to this app directory.
 * Hostinger checkouts often sit under a parent folder that also has a
 * package-lock.json; without this, Next can infer the wrong workspace root
 * and fail with "Standalone server is missing .../.next/standalone/server.js".
 */
const configDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright ≥1.60 loads browsers.json via require(path.join(packageRoot, ...)),
 * which NFT cannot statically trace. Keep these includes for PDF/PNG + audit
 * Chromium routes on Node hosts (Hostinger standalone, Vercel, Netlify, etc.).
 *
 * @sparticuz/chromium supplies a Linux Chromium binary when system Chrome is
 * unavailable. Including browsers.json alone does NOT install a browser.
 */
const playwrightRuntimeAssets = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/@sparticuz/chromium/**",
] as const;

/**
 * Hostinger Node.js (app_type: next) builds in server mode and merges
 * `output: "standalone"` into this object-export config. Export a plain object
 * (not a function) so Hostinger can merge settings correctly.
 *
 * hPanel: Application type `next`, build `build`, output directory `.next`,
 * Node 20+, start e.g. `npm run start -- -p $PORT`.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: configDir,

  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,

  serverExternalPackages: [
    "@sparticuz/chromium",
    "playwright",
    "playwright-core",
  ],

  // Escape [id] — picomatch treats bare [id] as a character class, so the
  // include never matches App Router dynamic segments.
  outputFileTracingIncludes: {
    "/api/audit/run": [...playwrightRuntimeAssets],
    "/api/report/\\[id\\]/pdf": [...playwrightRuntimeAssets],
    "/api/report/\\[id\\]/png": [...playwrightRuntimeAssets],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  poweredByHeader: false,

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
