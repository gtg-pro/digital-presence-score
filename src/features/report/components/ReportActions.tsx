"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export type ReportActionsProps = {
  report: DigitalPresenceReport;
};

/**
 * Report downloads hit trusted server export routes.
 * Live exports POST the in-page report payload so download does not depend on
 * the short-lived cookie still being present.
 * Email and public sharing are intentionally not offered until implemented.
 */
export function ReportActions({ report }: ReportActionsProps) {
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportId = report.id;
  const isDemo = report.isDemo;

  async function download(format: "pdf" | "png") {
    setError(null);
    setBusy(format);
    try {
      const response = await fetch(
        `/api/report/${encodeURIComponent(reportId)}/${format}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: format === "pdf" ? "application/pdf" : "image/png",
          },
          body: JSON.stringify({ report }),
        },
      );

      if (!response.ok) {
        let message = `Unable to download ${format.toUpperCase()}.`;
        try {
          const payload = (await response.json()) as { message?: string };
          if (payload.message) message = payload.message;
        } catch {
          // ignore non-JSON error bodies
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const matched = /filename="([^"]+)"/i.exec(disposition);
      const filename =
        matched?.[1] ?? `digital-presence-report.${format}`;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(`Unable to download ${format.toUpperCase()}.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="report-actions-heading"
      className="space-y-5 rounded-2xl border border-white/10 bg-[#0F1114] p-6 sm:p-8"
    >
      <div>
        <h2
          id="report-actions-heading"
          className="text-2xl font-semibold tracking-tight text-white"
        >
          Report actions
        </h2>
        <p className="mt-2 text-sm text-[#9EA5B3]">
          {isDemo
            ? "Download illustrative PDF or PNG exports of this sample report. Email delivery and public sharing are not available."
            : "Download a PDF or PNG of this report. Email delivery and public sharing are not available."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
          disabled={busy !== null}
          aria-busy={busy === "pdf"}
          onClick={() => void download("pdf")}
          aria-label={isDemo ? "Download sample PDF" : "Download PDF"}
        >
          <Download className="size-4" aria-hidden="true" />
          {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
          disabled={busy !== null}
          aria-busy={busy === "png"}
          onClick={() => void download("png")}
          aria-label={isDemo ? "Download sample PNG" : "Download PNG"}
        >
          <Download className="size-4" aria-hidden="true" />
          {busy === "png" ? "Preparing PNG…" : "Download PNG"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-white" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
