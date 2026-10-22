export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

/**
 * Landing FAQ content reflecting the currently shipped product behavior.
 */
export const faqs: FAQItem[] = [
  {
    id: "what-is-report-card",
    question: "What is Digital Presence Score?",
    answer:
      "It's a digital assessment that reviews your business's publicly observable online presence across five areas: website experience, local SEO presence, reputation and trust, content authority, and conversion readiness.",
  },
  {
    id: "how-score-calculated",
    question: "How is my Digital Presence Score calculated?",
    answer:
      "Your score uses a structured 100-point framework across five categories. OpenAI retrieves available public website information, then each criterion is scored with fixed PASS/PARTIAL/FAIL anchors. A complete numerical score is shown only when enough public information supports publishing one.",
  },
  {
    id: "what-info-needed",
    question: "What information do I need to get started?",
    answer:
      "Start with your website URL. Optional business details can help label the report, but the audit focuses on publicly available information about the submitted website.",
  },
  {
    id: "unverified-information",
    question: "What happens if some information cannot be verified?",
    answer:
      "Missing information is not automatically treated as a failure. When available public information is incomplete, you receive a Digital Presence Overview with supported findings instead of an invented overall score.",
  },
  {
    id: "google-rankings",
    question: "Does this tool check my actual Google rankings?",
    answer:
      "No. The assessment reviews observable digital-presence signals. It is not an official Google evaluation and does not guarantee or certify search-engine rankings.",
  },
  {
    id: "downloadable-report",
    question: "Will I receive a downloadable report?",
    answer:
      "Yes. When your assessment finishes, you can view the report online and download PDF and PNG copies. Email delivery is not available yet.",
  },
  {
    id: "report-visibility",
    question: "Is my report publicly visible?",
    answer:
      "No. Reports are private to your browser session. Public sharing is not available. Live reports are held temporarily in encrypted session cookies (about 24 hours) and are not stored permanently on our servers.",
  },
  {
    id: "no-website",
    question: "Can I use this tool if my business doesn't have a website?",
    answer:
      "A website URL is required for the OpenAI website audit. If the site cannot be inspected from available public information, you receive a limited overview rather than an invented complete score.",
  },
  {
    id: "session-limits",
    question: "How long is my live report available?",
    answer:
      "Live reports are short-lived session snapshots (approximately 24 hours) with a limited encrypted cookie payload size. If the session expires or the result is too large to store, re-run the assessment to generate a new report.",
  },
];
