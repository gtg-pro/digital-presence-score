import { Menu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { adminSettingsDemo } from "@/features/admin/data/admin.mock";
import { cn } from "@/lib/cn";

export type AdminHeaderProps = {
  title: string;
  breadcrumbs?: string[];
  onMenuClick: () => void;
};

export function AdminHeader({
  title,
  breadcrumbs,
  onMenuClick,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg border border-border lg:hidden",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <p className="truncate text-xs text-muted-foreground">
              {breadcrumbs.join(" / ")}
            </p>
          ) : null}
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline">Demo Admin</Badge>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">
            {adminSettingsDemo.adminProfile.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {adminSettingsDemo.adminProfile.role}
          </p>
        </div>
      </div>
    </header>
  );
}
