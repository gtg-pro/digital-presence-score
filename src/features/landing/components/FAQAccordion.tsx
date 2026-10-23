"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { FAQItem } from "@/features/landing/data/faqs";
import { cn } from "@/lib/cn";

export type FAQAccordionProps = {
  items: FAQItem[];
  /** FAQ id expanded on first render. Defaults to the first item. */
  defaultOpenId?: string;
};

export function FAQAccordion({ items, defaultOpenId }: FAQAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(
    defaultOpenId ?? items[0]?.id ?? null,
  );

  if (items.length === 0) return null;

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-[#0F1114] px-4 py-4 sm:px-4"
          >
            <h3 className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "flex w-full items-start justify-between gap-4 text-left",
                  "text-base font-medium tracking-tight text-white",
                  "transition-colors hover:text-white/90",
                  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1114]",
                )}
                onClick={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              >
                <span className="pr-2">{item.question}</span>
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center text-[#9EA5B3]">
                  <ChevronDown
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              inert={isOpen ? undefined : true}
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0">
                <p className="pt-3 text-sm leading-relaxed text-[#9EA5B3] sm:text-[0.9375rem]">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
