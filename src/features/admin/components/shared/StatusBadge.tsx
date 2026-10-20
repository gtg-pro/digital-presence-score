import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const labels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partial",
  failed: "Failed",
  private: "Private",
  shared: "Shared",
  revoked: "Revoked",
  complete: "Complete",
  limited: "Limited",
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  open: "Open",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  not_assessed: "Not assessed",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {labels[status] ?? status}
    </Badge>
  );
}
