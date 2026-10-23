"use client";

import { useEffect, useRef, useState } from "react";

import { sectionSideNavItems } from "@/features/landing/data/section-side-nav";

/** Match section `scroll-mt-28` + sticky header clearance. */
const ACTIVE_LINE_OFFSET_PX = 112;

export function useSectionSideNavActive() {
  const [activeId, setActiveIdState] = useState(
    sectionSideNavItems[0]?.id ?? "",
  );
  const lockedIdRef = useRef<string | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setActiveId(id: string) {
    lockedIdRef.current = id;
    setActiveIdState(id);
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => {
      lockedIdRef.current = null;
    }, 800);
  }

  useEffect(() => {
    const sectionIds = sectionSideNavItems.map((item) => item.id);

    function updateActiveFromScroll() {
      if (lockedIdRef.current) return;

      const line = ACTIVE_LINE_OFFSET_PX;
      let currentId = sectionIds[0] ?? "";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= line) {
          currentId = id;
        }
      }

      setActiveIdState((prev) => (prev === currentId ? prev : currentId));
    }

    updateActiveFromScroll();
    window.addEventListener("scroll", updateActiveFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveFromScroll);

    return () => {
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  return { activeId, setActiveId } as const;
}
