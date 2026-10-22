/**
 * OpenAI-only assessment entrypoint.
 * Hybrid crawl/PageSpeed orchestration has been removed.
 */

export {
  DEFAULT_ASSESSMENT_TIMEOUT_MS,
  runAssessment,
} from "@/lib/audit/openai-audit/run-openai-assessment";
