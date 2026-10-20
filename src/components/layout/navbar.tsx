"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { SiteLogo } from "@/components/shared/site-logo";
import { mainNav, primaryCta, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/cn";

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return "";
}

function getHashFromHref(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.slice(hashIndex);
}

function isNavItemActive(
  item: NavItem,
  pathname: string,
  hash: string,
): boolean {
  if (item.href === "/") {
    return (
      pathname === "/" && (hash === "" || hash === "#" || hash === "#home")
    );
  }

  const itemHash = getHashFromHref(item.href);
  if (item.isSection && itemHash) {
    return pathname === "/" && hash === itemHash;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({
  item,
  pathname,
  hash,
  onNavigate,
  className,
}: {
  item: NavItem;
  pathname: string;
  hash: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = isNavItemActive(item, pathname, hash);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "text-foreground underline decoration-foreground/40 underline-offset-8",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

function CtaLink({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={primaryCta.href}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
        "transition-colors hover:bg-primary/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {primaryCta.label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribeHash,
    getHashSnapshot,
    getServerHashSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const menuId = useId();

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleSectionNavigate = () => {
    closeMobile();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <nav
        aria-label="Primary"
        className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className={cn(
            "relative z-10 flex min-w-0 max-w-[55%] shrink items-center sm:max-w-[14rem]",
            "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          onClick={closeMobile}
        >
          <SiteLogo height={90} priority className="h-10 w-auto sm:h-11" />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                pathname={pathname}
                hash={hash}
                onNavigate={item.isSection ? handleSectionNavigate : undefined}
              />
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <CtaLink className="hidden lg:inline-flex" />

          <button
            type="button"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground lg:hidden",
              "transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      <div
        id={menuId}
        className={cn(
          "border-t border-border bg-background lg:hidden",
          !mobileOpen && "hidden",
        )}
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {mainNav.map((item) => (
            <li key={`mobile-${item.href}`}>
              <NavLink
                item={item}
                pathname={pathname}
                hash={hash}
                onNavigate={
                  item.isSection ? handleSectionNavigate : closeMobile
                }
                className="block w-full"
              />
            </li>
          ))}
          <li className="pt-2">
            <CtaLink onNavigate={closeMobile} className="w-full" />
          </li>
        </ul>
      </div>
    </header>
  );
}
