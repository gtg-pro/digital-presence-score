import { redirect } from "next/navigation";

/**
 * Minimal-info / multi-field audit entry is retired.
 * Audits start from the homepage URL field only.
 */
export default function AuditPage() {
  redirect("/");
}
