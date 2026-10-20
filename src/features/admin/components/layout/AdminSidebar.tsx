"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  MousePointerClick,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";

import { SiteLogo } from "@/components/shared/site-logo";
import { Badge } from "@/components/ui/badge";
import { adminNavItems } from "@/features/admin/data/admin-nav";
import type { AdminNavItem } from "@/features/admin/types/admin.types";
import { cn } from "@/lib/cn";

const icons = {
  overview: LayoutDashboard,
  submissions: Building2,
  audits: ClipboardList,
  reports: FileText,
  scores: BarChart3,
  emails: Mail,
  cta: MousePointerClick,
  reviews: ShieldAlert,
  settings: Settings,
} as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AdminSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 lg:hidden",
          open ? "block" : "hidden",
        )}
        aria-hidden={!open}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0",
          open
            ? "translate-x-0"
            : "-translate-x-full max-lg:pointer-events-none max-lg:invisible",
        )}
        aria-label="Admin"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
          <div className="min-w-0">
            <Link href="/admin" className="inline-flex max-w-[11rem] items-center" onClick={onClose}>
              <SiteLogo width={148} />
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">Admin</p>
              <Badge variant="demo">Demo</Badge>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg border border-border lg:hidden",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {adminNavItems.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  active={isActive(pathname, item.href)}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = icons[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
