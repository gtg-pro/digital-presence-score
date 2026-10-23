import type { ReactNode } from "react";

import { SideMenu } from "./SideMenu";

const SECTION_BG_TOP_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1776426653/Frame_1686557386_fcl7tf.svg";
const SECTION_BG_MID_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1776427919/Frame_1686557389_1_fjvicb.svg";
const SECTION_BG_BOTTOM_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1776427919/Frame_1686557388_1_n7z07w.svg";

/**
 * Two-column landing layout: sticky SideMenu + main section stack.
 * Layered section artwork (hero / CTA / footer keep their own visuals).
 */
export function LandingSectionsShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate bg-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-x-clip"
      >
        <img
          src={SECTION_BG_TOP_URL}
          alt=""
          className="absolute top-[230px] left-1/2 w-full max-w-none -translate-x-1/2 select-none"
        />
        <img
          src={SECTION_BG_MID_URL}
          alt=""
          className="absolute top-[42%] left-1/2 w-full max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
        />
        <img
          src={SECTION_BG_BOTTOM_URL}
          alt=""
          className="absolute bottom-24 left-1/2 w-full max-w-none -translate-x-1/2 select-none"
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-6 lg:grid-cols-[220px_1fr] lg:gap-12 lg:px-10 xl:gap-14">
        <SideMenu variant="desktop" />

        <div className="min-w-0">
          <div className="lg:hidden">
            <SideMenu variant="mobile" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
