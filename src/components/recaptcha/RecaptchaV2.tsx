"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

const SCRIPT_ID = "google-recaptcha-v2-script";
const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";

export type RecaptchaV2Handle = {
  reset: () => void;
  getToken: () => string | null;
};

export type RecaptchaV2Props = {
  siteKey: string;
  onChange?: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  className?: string;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        },
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window unavailable"));
  }
  if (window.grecaptcha?.render) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("load failed")), {
        once: true,
      });
      if (window.grecaptcha?.render) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(script);
  });
}

export const RecaptchaV2 = forwardRef<RecaptchaV2Handle, RecaptchaV2Props>(
  function RecaptchaV2(
    { siteKey, onChange, onExpired, onError, className },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<number | null>(null);
    const tokenRef = useRef<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const labelId = useId();

    const setToken = useCallback(
      (token: string | null) => {
        tokenRef.current = token;
        onChange?.(token);
      },
      [onChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          tokenRef.current = null;
          onChange?.(null);
          if (widgetIdRef.current !== null && window.grecaptcha) {
            window.grecaptcha.reset(widgetIdRef.current);
          }
        },
        getToken: () => tokenRef.current,
      }),
      [onChange],
    );

    useEffect(() => {
      let cancelled = false;

      async function mount() {
        try {
          await loadRecaptchaScript();
          if (cancelled || !containerRef.current || !window.grecaptcha) return;

          window.grecaptcha.ready(() => {
            if (cancelled || !containerRef.current || !window.grecaptcha) return;
            if (widgetIdRef.current !== null) return;

            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                setToken(token);
              },
              "expired-callback": () => {
                setToken(null);
                onExpired?.();
              },
              "error-callback": () => {
                setToken(null);
                onError?.();
              },
              theme: "light",
              size: "normal",
            });
          });
        } catch {
          if (!cancelled) {
            setLoadError(
              "Security verification failed to load. Please refresh and try again.",
            );
            onError?.();
          }
        }
      }

      void mount();

      return () => {
        cancelled = true;
      };
    }, [siteKey, setToken, onExpired, onError]);

    return (
      <div className={className}>
        <p id={labelId} className="sr-only">
          CAPTCHA verification
        </p>
        <div
          ref={containerRef}
          aria-labelledby={labelId}
          className="overflow-x-auto"
        />
        {loadError ? (
          <p role="alert" className="mt-2 text-sm text-foreground">
            {loadError}
          </p>
        ) : null}
      </div>
    );
  },
);
