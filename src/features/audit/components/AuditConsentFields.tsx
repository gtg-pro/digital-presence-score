import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AuditFormFieldProps } from "@/features/audit/types/audit-form.types";

import { FieldError } from "./FieldError";

export function AuditConsentFields({
  values,
  errors,
  onChange,
}: AuditFormFieldProps) {
  return (
    <section aria-labelledby="consent-heading" className="space-y-4">
      <div>
        <h2
          id="consent-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Consent
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports stay private to your browser session. Public sharing and email
          delivery are not available.
        </p>
      </div>

      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <Checkbox
            id="agreeToTerms"
            name="agreeToTerms"
            checked={values.agreeToTerms}
            aria-invalid={errors.agreeToTerms ? true : undefined}
            aria-describedby={
              errors.agreeToTerms ? "agreeToTerms-error" : undefined
            }
            onChange={(event) => onChange("agreeToTerms", event.target.checked)}
          />
          <div className="space-y-1">
            <Label htmlFor="agreeToTerms" className="font-normal leading-snug">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
              >
                assessment terms
              </Link>{" "}
              and acknowledge that the tool will analyze publicly accessible
              business information.{" "}
              <span className="text-foreground">*</span>
            </Label>
            <FieldError
              id="agreeToTerms-error"
              message={errors.agreeToTerms}
            />
          </div>
        </li>
      </ul>
    </section>
  );
}
