"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startAuditFromWebsiteUrl } from "@/features/audit/actions/start-audit";
import {
  getWebsiteUrlValidationMessage,
  normalizeWebsiteUrl,
} from "@/lib/website-url";
import { cn } from "@/lib/cn";

export type WebsiteUrlInputProps = {
  className?: string;
  /**
   * When true (default), start a live audit session and go to progress.
   * Set false to only navigate to /audit with the URL prefilled.
   */
  startLiveAudit?: boolean;
  /** Destination path when startLiveAudit is false. Defaults to /audit. */
  auditPath?: string;
};

export function WebsiteUrlInput({
  className,
  startLiveAudit = true,
  auditPath = "/audit",
}: WebsiteUrlInputProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submittedOnce, setSubmittedOnce] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || submittedOnce) return;

    const message = getWebsiteUrlValidationMessage(value);
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    const normalized = normalizeWebsiteUrl(value);

    if (!startLiveAudit) {
      router.push(
        `${auditPath}?${new URLSearchParams({ url: normalized }).toString()}`,
      );
      return;
    }

    setSubmittedOnce(true);
    startTransition(async () => {
      const result = await startAuditFromWebsiteUrl(normalized);
      if (result && !result.ok) {
        setSubmittedOnce(false);
        setError(result.message);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("w-full", className)}
      aria-describedby={error ? errorId : undefined}
    >
      <Label htmlFor={inputId} className="sr-only">
        Website URL
      </Label>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Link2
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            name="websiteUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example-service.com"
            value={value}
            disabled={isPending || submittedOnce}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-14 pl-11 text-base sm:text-[1.05rem]"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending || submittedOnce}
          className="h-14 w-full shrink-0 px-6 text-base sm:w-auto sm:min-w-[11.5rem]"
        >
          {isPending || submittedOnce ? "Starting…" : "Get My Free Report"}
        </Button>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 text-left text-sm text-foreground"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
