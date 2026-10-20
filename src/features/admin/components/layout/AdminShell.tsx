"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { adminNavItems } from "@/features/admin/data/admin-nav";

import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

function titleForPath(pathname: string) {
  const exact = adminNavItems.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const nested = adminNavItems.find(
    (item) => item.href !== "/admin" && pathname.startsWith(item.href),
  );
  return nested?.label ?? "Admin";
}

function breadcrumbsForPath(pathname: string) {
  if (pathname === "/admin") return ["Admin", "Overview"];
  const parts = pathname.split("/").filter(Boolean);
  return ["Admin", ...parts.slice(1).map((part) => part.replace(/-/g, " "))];
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (sidebarOpen) setSidebarOpen(false);
  }

  useEffect(() => {
    if (!sidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-full bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={titleForPath(pathname)}
          breadcrumbs={breadcrumbsForPath(pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div
          id="main-content"
          className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
