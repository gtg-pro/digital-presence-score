"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getYearSnapshot() {
  return new Date().getFullYear();
}

function getServerYearSnapshot() {
  return null;
}

/** Defers `Date` to the client so prerender stays stable under Cache Components. */
export function CopyrightYear() {
  const year = useSyncExternalStore(
    subscribe,
    getYearSnapshot,
    getServerYearSnapshot,
  );

  if (year === null) {
    return <span className="inline-block min-w-[3ch]" aria-hidden="true" />;
  }

  return <>{year}</>;
}
