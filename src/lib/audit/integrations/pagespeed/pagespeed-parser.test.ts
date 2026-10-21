import { describe, expect, it } from "vitest";

import {
  createUnavailableEvidence,
  parsePagespeedResponse,
  type PsiApiResponse,
} from "@/lib/audit/integrations/pagespeed/pagespeed-parser";

function labResponse(overrides?: Partial<PsiApiResponse>): PsiApiResponse {
  return {
    id: "https://example.com/",
    analysisUTCTimestamp: "2026-10-20T12:00:00.000Z",
    lighthouseResult: {
      requestedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      fetchTime: "2026-10-20T12:00:00.000Z",
      lighthouseVersion: "12.0.0",
      categories: {
        performance: { score: 0.82, title: "Performance" },
      },
      audits: {
        "largest-contentful-paint": {
          id: "largest-contentful-paint",
          numericValue: 2400,
          numericUnit: "millisecond",
          displayValue: "2.4 s",
        },
        "cumulative-layout-shift": {
          id: "cumulative-layout-shift",
          numericValue: 0.05,
          numericUnit: "unitless",
          displayValue: "0.05",
        },
        "first-contentful-paint": {
          id: "first-contentful-paint",
          numericValue: 1200,
          numericUnit: "millisecond",
          displayValue: "1.2 s",
        },
        "total-blocking-time": {
          id: "total-blocking-time",
          numericValue: 180,
          numericUnit: "millisecond",
          displayValue: "180 ms",
        },
        "speed-index": {
          id: "speed-index",
          numericValue: 3000,
          numericUnit: "millisecond",
          displayValue: "3.0 s",
        },
        "total-byte-weight": {
          id: "total-byte-weight",
          numericValue: 850_000,
          numericUnit: "byte",
          displayValue: "850 KiB",
        },
        "render-blocking-resources": {
          id: "render-blocking-resources",
          displayValue: "Potential savings of 300 ms",
          details: {
            type: "opportunity",
            overallSavingsMs: 300,
            items: [{ url: "https://example.com/a.css" }],
          },
        },
      },
    },
    ...overrides,
  };
}

describe("parsePagespeedResponse", () => {
  it("extracts mobile lab metrics without inventing INP from TBT", () => {
    const evidence = parsePagespeedResponse({
      response: labResponse(),
      testedUrl: "https://example.com/",
      strategy: "mobile",
      measuredAt: "2026-10-20T12:00:00.000Z",
    });

    expect(evidence.deviceStrategy).toBe("mobile");
    expect(evidence.metrics.lighthousePerformanceScore.value).toBe(82);
    expect(evidence.metrics.lighthousePerformanceScore.classification).toBe(
      "lab",
    );
    expect(evidence.metrics.largestContentfulPaint.value).toBe(2400);
    expect(evidence.metrics.totalBlockingTime.value).toBe(180);
    expect(evidence.metrics.totalBlockingTime.classification).toBe("lab");
    expect(evidence.metrics.interactionToNextPaint.availability).toBe(
      "not_measured",
    );
    expect(evidence.metrics.interactionToNextPaint.classification).toBe(
      "field",
    );
    expect(evidence.metrics.renderBlockingResources.value).toBe(1);
  });

  it("extracts desktop strategy and field INP when CrUX provides it", () => {
    const evidence = parsePagespeedResponse({
      response: labResponse({
        loadingExperience: {
          overall_category: "AVERAGE",
          metrics: {
            INTERACTION_TO_NEXT_PAINT: { percentile: 210, category: "AVERAGE" },
          },
        },
      }),
      testedUrl: "https://example.com/services",
      strategy: "desktop",
      measuredAt: "2026-10-20T12:00:00.000Z",
    });

    expect(evidence.deviceStrategy).toBe("desktop");
    expect(evidence.metrics.interactionToNextPaint.availability).toBe(
      "available",
    );
    expect(evidence.metrics.interactionToNextPaint.value).toBe(210);
    expect(evidence.metrics.interactionToNextPaint.classification).toBe(
      "field",
    );
  });

  it("marks missing metrics as not_measured", () => {
    const evidence = parsePagespeedResponse({
      response: {
        lighthouseResult: {
          categories: { performance: { score: 0.5 } },
          audits: {},
        },
      },
      testedUrl: "https://example.com/",
      strategy: "mobile",
      measuredAt: "2026-10-20T12:00:00.000Z",
    });

    expect(evidence.metrics.largestContentfulPaint.availability).toBe(
      "not_measured",
    );
    expect(evidence.metrics.largestContentfulPaint.value).toBeNull();
  });
});

describe("createUnavailableEvidence", () => {
  it("returns not_assessed shell without fabricated scores", () => {
    const evidence = createUnavailableEvidence({
      testedUrl: "https://example.com/",
      strategy: "mobile",
      measuredAt: "2026-10-20T12:00:00.000Z",
      availability: "not_assessed",
      notes: "API failed",
    });
    expect(evidence.availability).toBe("not_assessed");
    expect(evidence.metrics.lighthousePerformanceScore.value).toBeNull();
    expect(evidence.metrics.lighthousePerformanceScore.availability).toBe(
      "not_measured",
    );
  });
});
