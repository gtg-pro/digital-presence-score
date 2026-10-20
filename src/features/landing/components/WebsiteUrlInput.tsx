"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getWebsiteUrlValidationMessage,
  normalizeWebsiteUrl,
} from "@/lib/website-url";
import { cn } from "@/lib/cn";

export type WebsiteUrlInputProps = {
  className?: string;
  /** Destination path for valid submissions. Defaults to /audit. */
  auditPath?: string;
};

export function WebsiteUrlInput({
  className,
  auditPath = "/audit",
}: WebsiteUrlInputProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = getWebsiteUrlValidationMessage(value);
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    const normalized = normalizeWebsiteUrl(value);
    const params = new URLSearchParams({ url: normalized });
    router.push(`${auditPath}?${params.toString()}`);
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
          className="h-14 w-full shrink-0 px-6 text-base sm:w-auto sm:min-w-[11.5rem]"
        >
          Get My Free Report
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
