import { resolveE2EAuditInjectables } from "@/features/audit/lib/e2e-audit-fixtures";
import {
  beginAuditRequest,
  checkAuditRateLimit,
  endAuditRequest,
} from "@/features/audit/lib/audit-rate-limit";
import {
  clearPendingAudit,
  loadPendingAudit,
} from "@/features/audit/lib/pending-audit-session";
import {
  isAllowedAuditRequestOrigin,
  MAX_AUDIT_REQUEST_BODY_BYTES,
} from "@/features/audit/lib/request-origin";
import { runAuditStream } from "@/features/audit/lib/run-audit-stream";
import { validateAuditRunRequest } from "@/features/audit/lib/validate-audit-run-request";
import type { AuditStreamEvent } from "@/features/audit/types/audit-run.types";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "Content-Type": "text/event-stream; charset=utf-8",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function sseEncode(event: AuditStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedAuditRequestOrigin(request)) {
    return Response.json(
      {
        type: "error",
        code: "invalid_input",
        message: "Cross-origin audit submissions are not allowed.",
        retryable: false,
        at: new Date().toISOString(),
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    Number(contentLength) > MAX_AUDIT_REQUEST_BODY_BYTES
  ) {
    return Response.json(
      {
        type: "error",
        code: "invalid_input",
        message: "Audit request payload is too large.",
        retryable: false,
        at: new Date().toISOString(),
      },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const key = clientKey(request);
  const rate = checkAuditRateLimit(key);
  if (!rate.ok) {
    const event: AuditStreamEvent = {
      type: "error",
      code: rate.reason === "busy" ? "busy" : "rate_limited",
      message: rate.message,
      retryable: true,
      at: new Date().toISOString(),
    };
    return Response.json(event, {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let bodyJson: unknown = null;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const text = await request.text();
      if (text.length > MAX_AUDIT_REQUEST_BODY_BYTES) {
        return Response.json(
          {
            type: "error",
            code: "invalid_input",
            message: "Audit request payload is too large.",
            retryable: false,
            at: new Date().toISOString(),
          },
          { status: 413, headers: { "Cache-Control": "no-store" } },
        );
      }
      bodyJson = text ? JSON.parse(text) : null;
    }
  } catch {
    bodyJson = null;
  }

  const pending = await loadPendingAudit();
  const bodyRecord =
    bodyJson && typeof bodyJson === "object"
      ? (bodyJson as Record<string, unknown>)
      : null;
  const bodyHasInputs = Boolean(
    bodyRecord &&
      ((typeof bodyRecord.websiteUrl === "string" &&
        bodyRecord.websiteUrl.trim()) ||
        (typeof bodyRecord.businessName === "string" &&
          bodyRecord.businessName.trim()) ||
        bodyRecord.entryMode === "minimal"),
  );
  const source = bodyHasInputs ? bodyJson : (pending ?? bodyJson);
  if (!source) {
    return Response.json(
      {
        type: "error",
        code: "invalid_input",
        message: "No pending audit session. Submit the audit form again.",
        retryable: true,
        at: new Date().toISOString(),
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validated = validateAuditRunRequest(source);
  if (!validated.ok) {
    return Response.json(
      {
        type: "error",
        code: validated.code,
        message: validated.message,
        retryable: false,
        at: new Date().toISOString(),
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  beginAuditRequest(key);
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());

  const e2e = resolveE2EAuditInjectables(
    request.headers.get("x-audit-e2e-fixture"),
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: AuditStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(sseEncode(event)));
        } catch {
          // Client gone
        }
      };

      try {
        let completed = false;
        await runAuditStream({
          websiteUrl: validated.normalizedWebsiteUrl,
          businessName: validated.body.businessName ?? null,
          businessModelHint: validated.body.businessModelHint,
          allowMissingWebsite: validated.allowMissingWebsite,
          signal: abort.signal,
          // When E2E injectables are present, use them (do not skip those stages).
          // Otherwise honor AUDIT_SKIP_* for local/dev without provider keys.
          skipPagespeed: e2e ? false : process.env.AUDIT_SKIP_PAGESPEED === "1",
          skipOpenAI: e2e ? false : process.env.AUDIT_SKIP_OPENAI === "1",
          crawlFn: e2e?.crawlFn,
          pagespeedFn: e2e?.pagespeedFn,
          analysisFn: e2e?.analysisFn,
          scoringFn: e2e?.scoringFn,
          onEvent: (event) => {
            if (event.type === "complete") completed = true;
            send(event);
          },
        });
        if (completed) {
          await clearPendingAudit();
        }
      } finally {
        endAuditRequest(key);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      abort.abort();
      endAuditRequest(key);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: NO_STORE,
  });
}
