"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RecaptchaV2,
  type RecaptchaV2Handle,
} from "@/components/recaptcha/RecaptchaV2";
import { startAuditFromWebsiteUrl } from "@/features/audit/actions/start-audit";
import {
  getWebsiteUrlValidationMessage,
  normalizeWebsiteUrl,
} from "@/lib/website-url";
import { cn } from "@/lib/cn";

const HERO_ARROW_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792670199/Vector_431_Stroke_sy2hqa.svg";

export type WebsiteUrlInputProps = {
  className?: string;
  /**
   * When true (default), start a live audit session and go to progress.
   * Set false to only navigate to /audit with the URL prefilled.
   */
  startLiveAudit?: boolean;
  /** Destination path when startLiveAudit is false. Defaults to /audit. */
  auditPath?: string;
  /**
   * reCAPTCHA v2 site key from the server (`RECAPTCHA_SITE_KEY`).
   * Must be passed from a Server Component — it is not available as NEXT_PUBLIC_*.
   */
  recaptchaSiteKey?: string | null;
  /** Visual style. `hero` matches the Figma landing hero. */
  variant?: "default" | "hero";
};

export function WebsiteUrlInput({
  className,
  startLiveAudit = true,
  auditPath = "/audit",
  recaptchaSiteKey = null,
  variant = "default",
}: WebsiteUrlInputProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const captchaRef = useRef<RecaptchaV2Handle>(null);
  const [value, setValue] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const siteKey = recaptchaSiteKey?.trim() ?? "";
  const captchaRequired = startLiveAudit && Boolean(siteKey);
  const isHero = variant === "hero";

  function resetCaptcha() {
    captchaRef.current?.reset();
    setCaptchaToken(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || submittedOnce) return;

    const message = getWebsiteUrlValidationMessage(value);
    if (message) {
      setError(message);
      return;
    }

    if (startLiveAudit && captchaRequired && !captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    if (startLiveAudit && !siteKey) {
      setError(
        "Security verification is temporarily unavailable. Please try again later.",
      );
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
      const result = await startAuditFromWebsiteUrl(normalized, captchaToken);
      if (result && !result.ok) {
        setSubmittedOnce(false);
        setError(result.message);
        resetCaptcha();
      }
    });
  }

  const busy = isPending || submittedOnce;

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

      <div className="flex w-full flex-col gap-3">
        <div
          className={cn(
            "flex w-full flex-col gap-3",
            isHero && "items-stretch sm:flex-row sm:items-start sm:justify-center sm:gap-9",
          )}
        >
          <div
            className={cn(
              "relative min-w-0 w-full",
              isHero && "sm:max-w-[421px] sm:flex-1",
            )}
          >
            <Link2
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 sm:size-6",
                isHero ? "text-[#9EA5B3]" : "text-muted-foreground",
              )}
            />
            <Input
              id={inputId}
              name="websiteUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder={
                isHero ? "http://example-service.com" : "https://example-service.com"
              }
              value={value}
              disabled={busy}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "h-14 pl-11 text-base sm:text-[1.05rem]",
                isHero &&
                  "rounded-full border-transparent bg-[#0A0A0A] text-white placeholder:text-[#9EA5B3] focus-visible:ring-[#2563EB] focus-visible:ring-offset-[#0F1114]",
              )}
            />
          </div>

          {!isHero && captchaRequired ? (
            <div className="flex justify-center sm:justify-start">
              <RecaptchaV2
                ref={captchaRef}
                siteKey={siteKey}
                onChange={(token) => {
                  setCaptchaToken(token);
                  if (token && error) setError(null);
                }}
                onExpired={() => {
                  setCaptchaToken(null);
                  setError("Verification expired. Please verify again.");
                }}
                onError={() => {
                  setCaptchaToken(null);
                  setError("Security verification failed. Please try again.");
                }}
              />
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            disabled={busy}
            className={cn(
              "h-14 w-full shrink-0 px-6 text-base sm:w-auto sm:min-w-[11.5rem]",
              isHero &&
                "group gap-4 rounded-full border-[#2563EB] bg-[#2563EB] px-5 py-3 font-bold tracking-[-0.02em] text-white shadow-[0px_7px_14.5px_rgba(100,100,111,0.2)] hover:bg-[#1d4ed8] focus-visible:ring-[#2563EB] focus-visible:ring-offset-[#0F1114] sm:w-auto sm:min-w-0",
            )}
          >
            <span
              className={cn(
                isHero &&
                  "transition-transform duration-300 ease-out group-hover:translate-x-[-2px]",
              )}
            >
              {busy ? "Starting…" : "Get My Free Report"}
            </span>
            {isHero && !busy ? (
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white p-2.5 transition-transform duration-300 ease-out group-hover:translate-x-[2px]">
                <img
                  src={HERO_ARROW_URL}
                  alt=""
                  width={14}
                  height={14}
                  aria-hidden="true"
                  className="size-3.5 transition-transform duration-300 ease-out group-hover:rotate-45"
                />
              </span>
            ) : null}
          </Button>
        </div>

        {isHero && captchaRequired ? (
          <div className="flex justify-center">
            <RecaptchaV2
              ref={captchaRef}
              siteKey={siteKey}
              onChange={(token) => {
                setCaptchaToken(token);
                if (token && error) setError(null);
              }}
              onExpired={() => {
                setCaptchaToken(null);
                setError("Verification expired. Please verify again.");
              }}
              onError={() => {
                setCaptchaToken(null);
                setError("Security verification failed. Please try again.");
              }}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn(
            "mt-3 text-left text-sm",
            isHero ? "text-center text-red-300" : "text-foreground",
          )}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
