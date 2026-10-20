import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  conversionGoalOptions,
  industryOptions,
  serviceDeliveryOptions,
} from "@/features/audit/data/industry-options";
import type { AuditFormFieldProps } from "@/features/audit/types/audit-form.types";

import { FieldError } from "./FieldError";

export function BusinessInformationFields({
  values,
  errors,
  onChange,
}: AuditFormFieldProps) {
  const isUrlMode = values.entryMode === "url";

  return (
    <section aria-labelledby="business-info-heading" className="space-y-6">
      <div>
        <h2
          id="business-info-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Business information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isUrlMode
            ? "Website URL is required. Other details are optional and help refine your assessment."
            : "Share enough details to identify your business without inventing a website score."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">
          Website URL
          {isUrlMode ? (
            <span className="text-foreground"> *</span>
          ) : (
            <span className="font-normal text-muted-foreground"> (optional)</span>
          )}
        </Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://example-service.com"
          value={values.websiteUrl}
          aria-invalid={errors.websiteUrl ? true : undefined}
          aria-describedby={errors.websiteUrl ? "websiteUrl-error" : undefined}
          onChange={(event) => onChange("websiteUrl", event.target.value)}
        />
        <FieldError id="websiteUrl-error" message={errors.websiteUrl} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessName">
            Business Name
            {!isUrlMode ? (
              <span className="text-foreground"> *</span>
            ) : (
              <span className="font-normal text-muted-foreground"> (optional)</span>
            )}
          </Label>
          <Input
            id="businessName"
            name="businessName"
            type="text"
            autoComplete="organization"
            placeholder="Enter your business name"
            value={values.businessName}
            aria-invalid={errors.businessName ? true : undefined}
            aria-describedby={
              errors.businessName ? "businessName-error" : undefined
            }
            onChange={(event) => onChange("businessName", event.target.value)}
          />
          <FieldError id="businessName-error" message={errors.businessName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry / Business Category{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            id="industry"
            name="industry"
            value={values.industry}
            onChange={(event) => onChange("industry", event.target.value)}
          >
            <option value="">Select an industry</option>
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceDeliveryModel">
            Service Delivery Model{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            id="serviceDeliveryModel"
            name="serviceDeliveryModel"
            value={values.serviceDeliveryModel}
            onChange={(event) =>
              onChange("serviceDeliveryModel", event.target.value)
            }
          >
            <option value="">Select a model</option>
            {serviceDeliveryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="primaryServiceArea">
            Primary Service Area
            {!isUrlMode && !values.remoteOnly ? (
              <span className="text-foreground"> *</span>
            ) : (
              <span className="font-normal text-muted-foreground"> (optional)</span>
            )}
          </Label>
          <Input
            id="primaryServiceArea"
            name="primaryServiceArea"
            type="text"
            placeholder="City, region, or service area"
            value={values.primaryServiceArea}
            disabled={values.remoteOnly}
            aria-invalid={errors.primaryServiceArea ? true : undefined}
            aria-describedby={
              errors.primaryServiceArea
                ? "primaryServiceArea-error remoteOnly-hint"
                : "remoteOnly-hint"
            }
            onChange={(event) =>
              onChange("primaryServiceArea", event.target.value)
            }
          />
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="remoteOnly"
              name="remoteOnly"
              checked={values.remoteOnly}
              onChange={(event) => {
                onChange("remoteOnly", event.target.checked);
                if (event.target.checked) {
                  onChange("primaryServiceArea", "");
                }
              }}
            />
            <Label
              htmlFor="remoteOnly"
              id="remoteOnly-hint"
              className="text-sm font-normal leading-snug text-muted-foreground"
            >
              Remote / online only — no geographic service area
            </Label>
          </div>
          <FieldError
            id="primaryServiceArea-error"
            message={errors.primaryServiceArea}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="primaryConversionGoal">
            Primary Conversion Goal{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            id="primaryConversionGoal"
            name="primaryConversionGoal"
            value={values.primaryConversionGoal}
            onChange={(event) =>
              onChange("primaryConversionGoal", event.target.value)
            }
          >
            <option value="">Select a goal</option>
            {conversionGoalOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  );
}
