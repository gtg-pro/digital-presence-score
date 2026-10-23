"use server";

import { redirect } from "next/navigation";

import { stashPendingAudit } from "@/features/audit/lib/pending-audit-session";
import { validateAuditRunRequest } from "@/features/audit/lib/validate-audit-run-request";
import type { AuditFormValues } from "@/features/audit/types/audit-form.types";
import { validateAuditForm } from "@/features/audit/lib/validate-audit-form";

export type StartAuditResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Validate form values, stash a short-lived pending audit cookie, redirect to progress.
 */
export async function startAuditFromForm(
  values: AuditFormValues,
): Promise<StartAuditResult> {
  const fieldErrors = validateAuditForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors as Record<string, string>,
    };
  }

  const validated = validateAuditRunRequest({
    websiteUrl: values.websiteUrl,
    businessName: values.businessName,
    entryMode: values.entryMode,
    remoteOnly: values.remoteOnly,
    primaryServiceArea: values.primaryServiceArea,
    industry: values.industry,
    businessModelHint:
      values.remoteOnly || values.serviceDeliveryModel === "remote"
        ? "remote_online"
        : values.serviceDeliveryModel === "local"
          ? "local_service"
          : undefined,
  });

  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  const stashed = await stashPendingAudit(validated.body);
  if (!stashed.ok) {
    return { ok: false, message: stashed.message };
  }

  redirect("/audit/progress");
}

/**
 * Homepage hero URL → pending audit → progress.
 */
export async function startAuditFromWebsiteUrl(
  websiteUrl: string,
): Promise<StartAuditResult> {
  const validated = validateAuditRunRequest({
    websiteUrl,
    entryMode: "url",
  });
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  const stashed = await stashPendingAudit(validated.body);
  if (!stashed.ok) {
    return { ok: false, message: stashed.message };
  }

  redirect("/audit/progress");
}
