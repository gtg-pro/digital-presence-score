"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { adminAudits } from "@/features/admin/data/admin.mock";
import type { AdminAudit } from "@/features/admin/types/admin.types";

export function AuditsPage() {
  const [selected, setSelected] = useState<AdminAudit | null>(adminAudits[0] ?? null);

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Audit Management
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review illustrative audit processing states. Retry remains demo-only.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Audit ID</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Coverage</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {adminAudits.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.businessName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.createdAtLabel}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.currentStage}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {row.evidenceCoveragePercent}%
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={() => setSelected(row)}
                  >
                    View audit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {selected.businessName}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.id} · Scoring {selected.scoringVersion}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled title="Demo only">
                Review evidence
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled
                title="Retry is demo-only and does not run processing"
              >
                Retry audit
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{selected.evidenceSummary}</p>
          {selected.errorDetail ? (
            <p className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
              {selected.errorDetail}
            </p>
          ) : null}

          <ul className="space-y-2">
            {selected.stages.map((stage) => (
              <li
                key={stage.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{stage.name}</span>
                <StatusBadge status={stage.status} />
              </li>
            ))}
          </ul>

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Unknown / unavailable checks
            </h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {selected.unavailableChecks.length ? (
                selected.unavailableChecks.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>None listed in this demo fixture.</li>
              )}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
