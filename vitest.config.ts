import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Allow importing server-only modules in Vitest
      "server-only": path.resolve(__dirname, "./src/lib/audit/test/server-only-stub.ts"),
    },
  },
});
