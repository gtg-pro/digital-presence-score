import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditFormFieldProps } from "@/features/audit/types/audit-form.types";

import { FieldError } from "./FieldError";

export function EmailDeliveryFields({
  values,
  errors,
  onChange,
}: AuditFormFieldProps) {
  return (
    <section aria-labelledby="email-heading" className="space-y-4">
      <div>
        <h2
          id="email-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Email delivery
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide your email if you&apos;d like to receive a copy of your
          report. Email is optional in this preview.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@business.com"
          value={values.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          onChange={(event) => {
            const next = event.target.value;
            onChange("email", next);
            if (!next.trim() && values.receiveReportByEmail) {
              onChange("receiveReportByEmail", false);
            }
          }}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>
    </section>
  );
}
