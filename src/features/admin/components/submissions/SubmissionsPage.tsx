"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { adminSubmissions } from "@/features/admin/data/admin.mock";
import type { AdminSubmission } from "@/features/admin/types/admin.types";

const PAGE_SIZE = 4;

export function SubmissionsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminSubmission | null>(null);

  const industries = useMemo(
    () => Array.from(new Set(adminSubmissions.map((item) => item.industry))),
    [],
  );

  const filtered = useMemo(() => {
    return adminSubmissions.filter((item) => {
      const matchesQuery =
        !query.trim() ||
        item.businessName.toLowerCase().includes(query.toLowerCase()) ||
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        (item.website ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || item.auditStatus === status;
      const matchesIndustry = industry === "all" || item.industry === industry;
      return matchesQuery && matchesStatus && matchesIndustry;
    });
  }, [query, status, industry]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Businesses & Submissions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search and filter illustrative submissions. No data is persisted.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search business, ID, or website"
          aria-label="Search submissions"
        />
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
          aria-label="Filter by audit status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </Select>
        <Select
          value={industry}
          onChange={(event) => {
            setIndustry(event.target.value);
            setPage(0);
          }}
          aria-label="Filter by industry"
        >
          <option value="all">All industries</option>
          {industries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Submission ID</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Audit</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.businessName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.website ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.industry}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.submittedAtLabel}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.auditStatus} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={() => setSelected(row)}
                  >
                    View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {pageCount} · Demo pagination
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={currentPage === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={currentPage >= pageCount - 1}
            onClick={() =>
              setPage((value) => Math.min(pageCount - 1, value + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>

      {selected ? (
        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {selected.businessName}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Submission {selected.id} · Demo details panel
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <Detail label="Website" value={selected.website ?? "Not provided"} />
            <Detail label="Industry" value={selected.industry} />
            <Detail label="Service area" value={selected.serviceArea} />
            <Detail label="Email (demo)" value={selected.email} />
            <Detail label="Submitted" value={selected.submittedAtLabel} />
            <Detail
              label="Public profiles"
              value={
                selected.publicProfiles.length
                  ? selected.publicProfiles.join(", ")
                  : "None"
              }
            />
            <Detail
              label="Consent"
              value={`Terms ${selected.consents.terms ? "yes" : "no"} · Email report ${selected.consents.emailReport ? "yes" : "no"} · Marketing ${selected.consents.marketing ? "yes" : "no"}`}
            />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Editing and deletion are not available in this frontend demo.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
