"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ReportActionsProps = {
  reportId: string;
  isDemo?: boolean;
};

/**
 * Report downloads hit trusted server export routes.
 * Email and public sharing are intentionally not offered until implemented.
 */
export function ReportActions({
  reportId,
  isDemo = false,
}: ReportActionsProps) {
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(format: "pdf" | "png") {
    setError(null);
    setBusy(format);
    try {
      const response = await fetch(
        `/api/report/${encodeURIComponent(reportId)}/${format}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
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
      className="space-y-5 rounded-xl border border-border bg-background p-6 shadow-sm"
    >
      <div>
        <h2
          id="report-actions-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Report actions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isDemo
            ? "Download illustrative PDF or PNG exports of this sample report. Email delivery and public sharing are not available."
            : "Download a PDF or PNG of this report. Live reports are private browser-session snapshots (about 30 minutes) and are not emailed or shared publicly."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
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
          className="gap-2"
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
        <p className="text-sm text-foreground" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
