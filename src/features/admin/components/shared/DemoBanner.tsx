import { Badge } from "@/components/ui/badge";
import { adminDemoBanner } from "@/features/admin/data/admin.mock";

export function DemoBanner() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <Badge variant="demo">Demo</Badge>
      <span>{adminDemoBanner}</span>
    </div>
  );
}
