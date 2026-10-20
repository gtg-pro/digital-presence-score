"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

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
    <div className="border-t border-border">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id} className="border-b border-border">
            <h3 className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "flex w-full items-start justify-between gap-4 py-5 text-left",
                  "text-base font-medium tracking-tight text-foreground",
                  "transition-colors hover:text-foreground/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
                )}
                onClick={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              >
                <span className="pr-2">{item.question}</span>
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center text-foreground">
                  {isOpen ? (
                    <Minus className="size-4" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
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
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
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
