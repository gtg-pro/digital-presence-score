import { Suspense } from "react";

import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background" />
  );
}

/** Shared marketing/audit chrome (navbar + main + footer). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
