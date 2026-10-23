"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { sectionSideNavItems } from "@/features/landing/data/section-side-nav";
import { useSectionSideNavActive } from "@/features/landing/hooks/useSectionSideNavActive";
import { cn } from "@/lib/cn";

const SECTION_SCROLL_OFFSET_PX = 112;

function scrollToSection(hash: string) {
  const id = hash.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return;
  const top =
    el.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_OFFSET_PX;
  window.scrollTo({ top, behavior: "smooth" });
}

export type SideMenuProps = {
  variant?: "desktop" | "mobile";
};

export function SideMenu({ variant = "desktop" }: SideMenuProps) {
  const { activeId, setActiveId } = useSectionSideNavActive();

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string,
  ) {
    event.preventDefault();
    scrollToSection(href);
    setActiveId(id);
    window.history.replaceState(null, "", href);
  }

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Section navigation"
        className="sticky top-[72px] z-20 mb-4 flex gap-2 overflow-x-auto py-2 whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sectionSideNavItems.map((item) => {
          const isActive = activeId === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={isActive ? "true" : undefined}
              onClick={(event) => handleNavClick(event, item.href, item.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm transition-colors duration-200",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500",
                isActive
                  ? "border border-white/70 font-medium text-white"
                  : "border border-transparent text-gray-400 hover:text-white",
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="sticky top-[100px] z-20 mt-24 hidden self-start lg:block">
      <nav
        aria-label="Section navigation"
        className="w-[220px] rounded-2xl bg-[#0F1114] p-3"
      >
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {sectionSideNavItems.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => handleNavClick(event, item.href, item.id)}
                  className={cn(
                    "block rounded-full px-4 py-2.5 text-sm transition-colors duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500",
                    isActive
                      ? "border border-white/70 font-medium text-white"
                      : "border border-transparent text-gray-400 hover:text-white",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <Link
          href="/#home"
          className={cn(
            "group relative z-10 mt-3 flex w-full items-center justify-between gap-2 rounded-full bg-blue-600 py-1.5 pr-1.5 pl-4",
            "text-sm font-medium text-white transition-colors hover:bg-blue-500",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500",
          )}
        >
          <span className="min-w-0 truncate transition-transform duration-300 ease-out group-hover:translate-x-[-2px]">
            Get Free Report
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 transition-transform duration-300 ease-out group-hover:translate-x-[2px]">
            <ArrowUpRight
              className="size-4 transition-transform duration-300 ease-out group-hover:rotate-45"
              aria-hidden="true"
            />
          </span>
        </Link>
      </nav>
    </aside>
  );
}
