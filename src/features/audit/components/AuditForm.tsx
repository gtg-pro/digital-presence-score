"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Link2, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RecaptchaV2,
  type RecaptchaV2Handle,
} from "@/components/recaptcha/RecaptchaV2";
import { startAuditFromForm } from "@/features/audit/actions/start-audit";
import { validateAuditForm } from "@/features/audit/lib/validate-audit-form";
import {
  initialAuditFormValues,
  type AuditEntryMode,
  type AuditFormErrors,
  type AuditFormValues,
} from "@/features/audit/types/audit-form.types";
import { cn } from "@/lib/cn";

import { AuditConsentFields } from "./AuditConsentFields";
import { BusinessInformationFields } from "./BusinessInformationFields";
import { EmailDeliveryFields } from "./EmailDeliveryFields";
import { PublicProfileFields } from "./PublicProfileFields";

export type AuditFormProps = {
  initialWebsiteUrl?: string;
  /** Server-provided reCAPTCHA v2 site key (`RECAPTCHA_SITE_KEY`). */
  recaptchaSiteKey?: string | null;
};

export function AuditForm({
  initialWebsiteUrl = "",
  recaptchaSiteKey = null,
}: AuditFormProps) {
  const [values, setValues] = useState<AuditFormValues>(() =>
    initialAuditFormValues(initialWebsiteUrl),
  );
  const [errors, setErrors] = useState<AuditFormErrors>({});
  const [profilesOpen, setProfilesOpen] = useState(
    () => Boolean(initialWebsiteUrl.trim()) === false,
  );
  const [isPending, startTransition] = useTransition();
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<RecaptchaV2Handle>(null);
  const siteKey = recaptchaSiteKey?.trim() ?? "";

  const fieldProps = useMemo(
    () => ({
      values,
      errors,
      onChange: <K extends keyof AuditFormValues>(
        field: K,
        value: AuditFormValues[K],
      ) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => {
          if (!current[field] && !current.profiles && !current.form) {
            return current;
          }
          const next = { ...current };
          delete next[field];
          if (field === "websiteUrl" || field.endsWith("Url")) {
            delete next.profiles;
          }
          delete next.form;
          return next;
        });
      },
    }),
    [values, errors],
  );

  function setEntryMode(mode: AuditEntryMode) {
    setValues((current) => ({ ...current, entryMode: mode }));
    setErrors({});
    if (mode === "minimal") {
      setProfilesOpen(true);
    }
  }

  function resetCaptcha() {
    captchaRef.current?.reset();
    setCaptchaToken(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || submittedOnce) return;

    const nextErrors = validateAuditForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.profiles) {
        setProfilesOpen(true);
      }
      return;
    }

    if (!siteKey) {
      setErrors((current) => ({
        ...current,
        form: "Security verification is temporarily unavailable. Please try again later.",
      }));
      return;
    }

    if (!captchaToken) {
      setErrors((current) => ({
        ...current,
        form: "Please complete the CAPTCHA verification.",
      }));
      return;
    }

    setSubmittedOnce(true);
    startTransition(async () => {
      const result = await startAuditFromForm(values, captchaToken);
      if (result && !result.ok) {
        setSubmittedOnce(false);
        resetCaptcha();
        setErrors((current) => ({
          ...current,
          ...(result.fieldErrors ?? {}),
          form: result.message,
        }));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold tracking-tight text-foreground">
          How would you like to start?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            selected={values.entryMode === "url"}
            title="I have a website URL"
            description="Primary path. We’ll use your site as the starting point for the assessment."
            icon={<Link2 className="size-5" aria-hidden="true" />}
            onSelect={() => setEntryMode("url")}
          />
          <ModeCard
            selected={values.entryMode === "minimal"}
            title="Minimal business details"
            description="No website required. Provide a name, market or remote-only flag, and at least one public profile or URL."
            icon={<NotebookPen className="size-5" aria-hidden="true" />}
            onSelect={() => setEntryMode("minimal")}
          />
        </div>
      </fieldset>

      <Card>
        <CardContent className="space-y-10 pt-6">
          <BusinessInformationFields {...fieldProps} />
          <div className="border-t border-border" />
          <PublicProfileFields
            {...fieldProps}
            open={profilesOpen}
            onOpenChange={setProfilesOpen}
          />
          <div className="border-t border-border" />
          <EmailDeliveryFields {...fieldProps} />
          <div className="border-t border-border" />
          <AuditConsentFields {...fieldProps} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {siteKey ? (
          <RecaptchaV2
            ref={captchaRef}
            siteKey={siteKey}
            onChange={(token) => {
              setCaptchaToken(token);
              if (token) {
                setErrors((current) => {
                  if (!current.form) return current;
                  const next = { ...current };
                  delete next.form;
                  return next;
                });
              }
            }}
            onExpired={() => {
              setCaptchaToken(null);
              setErrors((current) => ({
                ...current,
                form: "Verification expired. Please verify again.",
              }));
            }}
            onError={() => {
              setCaptchaToken(null);
              setErrors((current) => ({
                ...current,
                form: "Security verification failed. Please try again.",
              }));
            }}
          />
        ) : null}
        <Button
          type="submit"
          className="h-12 w-full sm:w-auto sm:min-w-[14rem]"
          disabled={isPending || submittedOnce}
        >
          {isPending || submittedOnce
            ? "Starting assessment…"
            : "Start My Assessment"}
        </Button>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Your assessment will review available public digital-presence signals.
          Some information may be unavailable or require further verification.
        </p>

        {errors.form ? (
          <p role="alert" className="text-sm text-foreground">
            {errors.form}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function ModeCard({
  selected,
  title,
  description,
  icon,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border bg-background p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-foreground"
          : "border-border hover:border-foreground/30",
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold text-foreground">
        {title}
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
