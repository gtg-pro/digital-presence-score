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
          Contact email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional. Email delivery of reports is not available yet — reports are
          shown in your browser session and can be downloaded as PDF or PNG.
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
          aria-describedby={
            errors.email ? "email-error email-unavailable-hint" : "email-unavailable-hint"
          }
          onChange={(event) => {
            const next = event.target.value;
            onChange("email", next);
            if (!next.trim() && values.receiveReportByEmail) {
              onChange("receiveReportByEmail", false);
            }
          }}
        />
        <p id="email-unavailable-hint" className="text-xs text-muted-foreground">
          Providing an email does not trigger automatic report delivery.
        </p>
        <FieldError id="email-error" message={errors.email} />
      </div>
    </section>
  );
}
