"use client";

import { useState } from "react";
import { Download, Link2, Mail, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Frontend placeholders only — no file generation, email, or public publishing.
 */
export function ReportActions() {
  const [shareOptIn, setShareOptIn] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);

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
          Downloads, email, and sharing are not connected in this frontend
          preview. Reports are private by default.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled
          className="gap-2"
          title="PDF download will be connected in a later phase"
          aria-label="Download PDF (unavailable in demo)"
        >
          <Download className="size-4" aria-hidden="true" />
          Download PDF
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled
          className="gap-2"
          title="PNG download will be connected in a later phase"
          aria-label="Download PNG (unavailable in demo)"
        >
          <Download className="size-4" aria-hidden="true" />
          Download PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled
          className="gap-2"
          title="Email delivery will be connected in a later phase"
          aria-label="Email my report (unavailable in demo)"
        >
          <Mail className="size-4" aria-hidden="true" />
          Email My Report
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!shareOptIn}
          className="gap-2"
          onClick={() => setShareEnabled(true)}
          title={
            shareOptIn
              ? "Sharing is a UI placeholder only"
              : "Opt in below before enabling share UI"
          }
          aria-label="Share report (demo placeholder)"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share Report
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-dashed border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="share-opt-in"
            checked={shareOptIn}
            onChange={(event) => {
              const next = event.target.checked;
              setShareOptIn(next);
              if (!next) setShareEnabled(false);
            }}
          />
          <Label htmlFor="share-opt-in" className="font-normal leading-snug">
            I understand sharing is optional and reports are private unless I
            explicitly opt in. (Demo UI only — no public link is published.)
          </Label>
        </div>

        {shareEnabled ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="size-4" aria-hidden="true" />
              Demo share link placeholder (not published)
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              onClick={() => {
                setShareEnabled(false);
                setShareOptIn(false);
              }}
            >
              Revoke sharing
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
