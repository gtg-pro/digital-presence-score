"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getYearSnapshot() {
  return new Date().getFullYear();
}

/**
 * Year must match on server and client during hydration.
 * Returning the calendar year from both snapshots avoids a
 * useSyncExternalStore getServerSnapshot ≠ getSnapshot warning.
 */
export function CopyrightYear() {
  const year = useSyncExternalStore(
    subscribe,
    getYearSnapshot,
    getYearSnapshot,
  );

  return <span suppressHydrationWarning>{year}</span>;
}
