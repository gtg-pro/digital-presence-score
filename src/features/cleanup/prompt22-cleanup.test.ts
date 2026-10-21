import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { faqs } from "@/features/landing/data/faqs";
import { sampleReport } from "@/features/report/data/sample-report";
import { reportDemoFixtures } from "@/features/report/data/report.mock";
import { mapAssessmentToReport } from "@/features/report/adapters/assessment-to-report";
import {
  footerCta,
  footerQuickLinks,
  mainNav,
  primaryCta,
} from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import {
  brochureFixture,
  blockedWebsiteFixture,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";
import type { CrawlResult } from "@/features/audit/types/evidence.types";
import type { AIAnalysisResult } from "@/lib/audit/integrations/openai/analysis.types";
import type { PerformanceResult } from "@/lib/audit/integrations/pagespeed/pagespeed.types";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";

const root = path.resolve(__dirname, "../../..");

function inject(fixture: {
  crawl: CrawlResult;
  performance: PerformanceResult | null;
  analysis: AIAnalysisResult | null;
}) {
  const candidate =
    fixture.crawl.website?.normalizedSeedUrl ??
    fixture.crawl.request.normalizedUrl ??
    "https://example.com/";
  const websiteUrl = candidate.includes("localhost")
    ? "https://example.com/"
    : candidate;
  return {
    websiteUrl,
    businessName: "Fixture Business",
    assessedAt: "2026-10-21T06:00:00.000Z",
    crawlFn: async () => fixture.crawl,
    pagespeedFn: async () => fixture.performance,
    analysisFn: async () => fixture.analysis,
  };
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("Prompt 22 — admin removal", () => {
  it("removes admin app routes and feature modules", () => {
    expect(existsSync(path.join(root, "src/app/(admin)"))).toBe(false);
    expect(existsSync(path.join(root, "src/features/admin"))).toBe(false);
  });

  it("has no production imports of admin features", () => {
    const files = collectSourceFiles(path.join(root, "src")).filter(
      (file) =>
        !file.includes(`${path.sep}admin${path.sep}`) &&
        !file.endsWith(`${path.sep}prompt22-cleanup.test.ts`),
    );
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (
        text.includes("@/features/admin") ||
        /href=["']\/admin/.test(text) ||
        /from ["']@\/app\/\(admin\)/.test(text)
      ) {
        offenders.push(path.relative(root, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("exposes no Admin navigation in public nav config", () => {
    const blob = JSON.stringify({ mainNav, footerQuickLinks, primaryCta });
    expect(blob.toLowerCase()).not.toContain("admin");
    expect(blob).not.toContain("/admin");
  });
});

describe("Prompt 22 — sample vs live report isolation", () => {
  it("keeps the sample report explicitly illustrative", () => {
    expect(sampleReport.isDemo).toBe(true);
    expect(sampleReport.id).not.toMatch(/^live-/);
    for (const fixture of Object.values(reportDemoFixtures)) {
      expect(fixture.isDemo).toBe(true);
      expect(fixture.id).toMatch(/^demo-/);
    }
  });

  it("does not fall back live assessments to demo fixtures", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    const mapped = mapAssessmentToReport(result);
    expect(mapped.isDemo).toBe(false);
    expect(mapped.id.startsWith("demo")).toBe(false);
  });

  it("preserves original COMPLETE scores without React recalculation artifacts", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    const mapped = mapAssessmentToReport(result);
    expect(mapped.overallScore).toBe(result.overallScore);
    expect(mapped.scoringVersion).toBe("strict-v1.0");
    expect(result.scoringPolicyFlags).toContain(
      "unassessed_weight_uses_absolute_points_earned",
    );
    expect(mapped.methodology.scoringVersion).toBe(result.scoringVersion);
  });

  it("keeps PARTIAL overall score null", async () => {
    const fixture = brochureFixture();
    const result = await runAssessment({
      ...inject(fixture),
      scoringFn: (input) => {
        const scored = scoreDigitalPresence({
          ...input,
          assessedAt: "2026-10-21T06:00:00.000Z",
        });
        return {
          ...scored,
          status: "PARTIAL",
          totalScore: null,
          maturity: {
            band: null,
            label: null,
            eligible: false,
            reason: "Partial",
          },
        };
      },
    });
    const mapped = mapAssessmentToReport(result);
    expect(mapped.outcome).toBe("partial");
    expect(mapped.overallScore).toBeNull();
    expect(mapped.maturityBand).toBeNull();
  });

  it("keeps LIMITED_VISIBILITY overall score null", async () => {
    const result = await runAssessment(inject(blockedWebsiteFixture()));
    const mapped = mapAssessmentToReport(result);
    expect(mapped.outcome).toBe("limited");
    expect(mapped.overallScore).toBeNull();
  });
});

describe("Prompt 22 — accurate public claims", () => {
  it("FAQ does not claim email delivery, public sharing, or permanent storage", () => {
    const blob = faqs.map((f) => `${f.question} ${f.answer}`).join("\n").toLowerCase();
    expect(blob).toContain("email delivery is not available");
    expect(blob).toContain("public sharing is not available");
    expect(blob).toMatch(/30 minutes|temporary|session/);
    expect(blob).not.toMatch(/admin review/);
    expect(blob).not.toMatch(/automatically emailed/);
    expect(blob).not.toMatch(/permanently stored on our servers/);
  });

  it("site disclaimer communicates session and delivery limits", () => {
    const text = siteConfig.disclaimer.toLowerCase();
    expect(text).toContain("30 minutes");
    expect(text).toContain("email delivery");
    expect(text).toContain("not available");
  });

  it("primary CTAs point to real destinations", () => {
    expect(primaryCta.href).toBe("/#contact");
    expect(primaryCta.label).toBe("Contact");
    expect(footerCta.href).toBe("/#home");
    expect(footerCta.label).toBe("Get My Free Report Card");
    expect(mainNav.some((item) => item.href === "/#why-it-matters")).toBe(true);
    expect(
      mainNav.findIndex((item) => item.href === "/#why-it-matters"),
    ).toBeLessThan(
      mainNav.findIndex((item) => item.href === "/#sample-report"),
    );
    expect(mainNav.some((item) => item.label === "Contact")).toBe(false);
    for (const item of mainNav) {
      expect(item.href).not.toBe("#");
      expect(item.href.length).toBeGreaterThan(0);
    }
    for (const item of footerQuickLinks) {
      expect(item.href).not.toBe("#");
    }
  });

  it("black contact CTA lives at the top of the footer, not as a mid-page section", () => {
    const footer = readFileSync(
      path.join(root, "src/components/layout/site-footer.tsx"),
      "utf8",
    );
    const marketing = readFileSync(
      path.join(root, "src/app/(marketing)/page.tsx"),
      "utf8",
    );
    expect(footer).toContain('id="contact"');
    expect(footer).toContain("footerCta");
    expect(footer).toContain("bg-foreground");
    expect(marketing).not.toContain("PrimaryCTASection");
  });

  it("ReportActions source no longer offers inert email/share controls", () => {
    const source = readFileSync(
      path.join(root, "src/features/report/components/ReportActions.tsx"),
      "utf8",
    );
    expect(source).not.toContain("Email My Report");
    expect(source).not.toContain("Share Report");
    expect(source).toContain("Download PDF");
    expect(source).toContain("Download PNG");
  });

  it("Strategy CTA links to homepage audit entry instead of a fake booking control", () => {
    const source = readFileSync(
      path.join(root, "src/features/report/components/StrategyCallCTA.tsx"),
      "utf8",
    );
    expect(source).toContain('href="/#home"');
    expect(source).not.toContain("Book a Strategy Call");
    expect(source).not.toContain("disabled");
  });
});
