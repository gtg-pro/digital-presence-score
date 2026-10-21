import { writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { reportDemoFixtures } from "@/features/report/data/report.mock";
import { exportReport } from "@/lib/report/export/report-export";

describe("export sample artifacts", () => {
  it("writes controlled COMPLETE PDF/PNG samples for verification", async () => {
    const report = reportDemoFixtures.complete;
    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    const png = await exportReport({ format: "png", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    expect(png.ok).toBe(true);
    if (!pdf.ok || !png.ok) return;

    const root = process.cwd();
    writeFileSync(
      path.join(root, "docs/examples/sample-export-complete.pdf"),
      pdf.bytes,
    );
    writeFileSync(
      path.join(root, "docs/examples/sample-export-complete.png"),
      png.bytes,
    );
    expect(pdf.bytes.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(png.bytes[0]).toBe(0x89);
  }, 90_000);
});
