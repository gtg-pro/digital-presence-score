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
      "Your score is calculated using a structured 100-point assessment framework (strict-v1.0). Each category is evaluated against predefined criteria using available evidence. A complete numerical score is displayed only when sufficient information can be verified.",
  },
  {
    id: "what-info-needed",
    question: "What information do I need to get started?",
    answer:
      "You can start with your website URL or provide basic business information. Additional details, such as your industry, service area, and public business profile links, may help complete the assessment.",
  },
  {
    id: "unverified-information",
    question: "What happens if some information cannot be verified?",
    answer:
      "Unavailable information is marked as Not Assessed rather than automatically treated as a failure. If there isn't enough evidence for a complete score, you'll receive a Partial Audit or Limited Visibility Snapshot.",
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
      "No. Reports are private to your browser session. Public sharing is not available. Live reports are held temporarily in encrypted session cookies (about 30 minutes) and are not stored permanently on our servers.",
  },
  {
    id: "no-website",
    question: "Can I use this tool if my business doesn't have a website?",
    answer:
      "Yes. You can provide basic business information and an available public business profile. If a website cannot be confidently identified, the application can provide a Limited Visibility Snapshot rather than inventing a complete website score.",
  },
  {
    id: "session-limits",
    question: "How long is my live report available?",
    answer:
      "Live reports are short-lived session snapshots (approximately 30 minutes) with a limited encrypted cookie payload size. If the session expires or the result is too large to store, re-run the assessment to generate a new report.",
  },
];
