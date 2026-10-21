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

function sectionIdsFromNav(items: NavItem[]): string[] {
  return items
    .map((item) => getHashFromHref(item.href)?.replace(/^#/, ""))
    .filter((id): id is string => Boolean(id));
}

function isNavItemActive(
  item: NavItem,
  pathname: string,
  hash: string,
  activeSectionId: string | null,
): boolean {
  if (pathname !== "/" && !item.isSection) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (pathname !== "/") {
    return false;
  }

  const itemHash = getHashFromHref(item.href);
  const itemId = itemHash?.replace(/^#/, "") ?? null;

  if (item.href === "/" || itemHash === "#home") {
    if (activeSectionId) {
      return activeSectionId === "home";
    }
    return hash === "" || hash === "#" || hash === "#home";
  }

  if (item.isSection && itemId) {
    if (activeSectionId) {
      return activeSectionId === itemId;
    }
    return hash === `#${itemId}`;
  }

  return pathname === item.href;
}

function NavLink({
  item,
  pathname,
  hash,
  activeSectionId,
  onNavigate,
  className,
}: {
  item: NavItem;
  pathname: string;
  hash: string;
  activeSectionId: string | null;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = isNavItemActive(item, pathname, hash, activeSectionId);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "no-underline",
        active ? "font-bold text-foreground" : "font-medium",
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
        "inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const menuId = useId();

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
    if (activeSectionId !== null) setActiveSectionId(null);
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

  useEffect(() => {
    if (pathname !== "/") return;

    const ids = ["home", ...sectionIdsFromNav(mainNav)];
    const uniqueIds = [...new Set(ids)];
    const elements = uniqueIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );
        const top = visible[0]?.target;
        if (top?.id) {
          setActiveSectionId(top.id);
        }
      },
      {
        root: null,
        // Account for sticky header; prefer the section near the top third.
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <nav
        aria-label="Primary"
        className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className={cn(
            "relative z-10 flex shrink-0 items-center",
            "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          onClick={closeMobile}
        >
          <SiteLogo
            height={56}
            priority
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 xl:gap-1 lg:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                pathname={pathname}
                hash={hash}
                activeSectionId={activeSectionId}
                onNavigate={closeMobile}
              />
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <CtaLink className="hidden lg:inline-flex" />

          <button
            type="button"
            className={cn(
              "inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground lg:hidden",
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
                activeSectionId={activeSectionId}
                onNavigate={closeMobile}
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
