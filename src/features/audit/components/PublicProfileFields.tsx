"use client";

import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditFormFieldProps } from "@/features/audit/types/audit-form.types";
import { cn } from "@/lib/cn";

import { FieldError } from "./FieldError";

const profileFields = [
  {
    name: "googleBusinessProfileUrl" as const,
    label: "Google Business Profile URL",
    placeholder: "https://maps.google.com/…",
  },
  {
    name: "facebookUrl" as const,
    label: "Facebook URL",
    placeholder: "https://facebook.com/…",
  },
  {
    name: "instagramUrl" as const,
    label: "Instagram URL",
    placeholder: "https://instagram.com/…",
  },
  {
    name: "linkedinUrl" as const,
    label: "LinkedIn URL",
    placeholder: "https://linkedin.com/…",
  },
  {
    name: "otherProfileUrl" as const,
    label: "Other relevant public profile URL",
    placeholder: "https://…",
  },
];

export type PublicProfileFieldsProps = AuditFormFieldProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublicProfileFields({
  values,
  errors,
  onChange,
  open,
  onOpenChange,
}: PublicProfileFieldsProps) {
  return (
    <section aria-labelledby="profiles-heading" className="space-y-4">
      <button
        type="button"
        className={cn(
          "flex w-full items-start justify-between gap-4 rounded-lg border border-border bg-background px-4 py-4 text-left",
          "transition-colors hover:border-foreground/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        aria-expanded={open}
        aria-controls="public-profiles-panel"
        onClick={() => onOpenChange(!open)}
      >
        <div>
          <h2
            id="profiles-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Additional public profiles
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. Expand to add public profile links that may provide extra
            context when accessible.
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-5 shrink-0 text-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id="public-profiles-panel"
        hidden={!open}
        className={cn(!open && "hidden")}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          These optional links can help provide additional context for your
          assessment when their public information is accessible. Providing a
          URL does not guarantee access to restricted platform data.
        </p>

        <div className="space-y-4">
          {profileFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="url"
                inputMode="url"
                placeholder={field.placeholder}
                value={values[field.name]}
                aria-invalid={errors[field.name] ? true : undefined}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
                onChange={(event) => onChange(field.name, event.target.value)}
              />
              <FieldError
                id={`${field.name}-error`}
                message={errors[field.name]}
              />
            </div>
          ))}
        </div>

        <FieldError id="profiles-error" message={errors.profiles} />
      </div>
    </section>
  );
}
