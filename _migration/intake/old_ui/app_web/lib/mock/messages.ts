import type {
  Channel,
  InboxItem,
  OutboxItem,
  TriageSummary,
} from "@/lib/types/messages";

export const MOCK_TRIAGE_SUMMARY: TriageSummary = {
  total: 47,
  triagedLabel: "6 minutes ago",
  breakdown: [
    { id: "ready", label: "ready for you", count: 2, alert: true },
    { id: "scheduling", label: "scheduling — Sinclair handling", count: 12 },
    { id: "relationship", label: "relationship — Kyle handling", count: 8 },
    { id: "informational", label: "informational — archived", count: 23 },
    { id: "newsletter", label: "newsletters — filed", count: 2 },
  ],
};

/**
 * Outbox items reflect the email auto-responder protocol (PRD 07).
 * Three batch windows: 8 AM / 12 PM / 4 PM EST. Approve → queue → batch.
 */
export const MOCK_OUTBOX: OutboxItem[] = [
  {
    id: "ob-emails-4pm",
    kind: "email-batch",
    summary: "3 approved emails · NTC committee, FlourishED client, Career intro",
    scheduledLabel: "4:00 PM batch",
    refs: ["appr-johnsmith"],
  },
  {
    id: "ob-invoice-247",
    kind: "invoice",
    summary: "Invoice #247 to Acme Co.",
    scheduledLabel: "tomorrow 9:00 AM",
    refs: ["appr-247"],
  },
];

export const MOCK_CHANNELS: Channel[] = [
  { id: "all", label: "All channels" },
  { id: "email", label: "Email", count: 4 },
  { id: "sms", label: "SMS" },
  { id: "voicemail", label: "Voicemail" },
  { id: "linkedin", label: "LinkedIn DMs" },
  { id: "ig", label: "IG DMs" },
];

/** Sample of routed/handled items — drilldown content. */
export const MOCK_INBOX_ITEMS: InboxItem[] = [
  {
    id: "in-1",
    channel: "email",
    sender: "Tara Choudhry — Acme",
    subject: "Quick intro request",
    summary: "Asks for an intro to Dr. M. Williams at NSU.",
    receivedLabel: "1h",
    contextId: "llc-flourished",
    intent: "relationship",
    routedTo: "kyle",
  },
  {
    id: "in-2",
    channel: "email",
    sender: "Daniel Park — NTC",
    subject: "Friday board readout — slide deck?",
    summary: "Asking if you'll bring slides to Friday's readout.",
    receivedLabel: "2h",
    contextId: "w2-ntc",
    intent: "scheduling_request",
    routedTo: "sinclair",
  },
  {
    id: "in-3",
    channel: "sms",
    sender: "Mom",
    summary: "Confirming Sunday dinner.",
    receivedLabel: "yesterday",
    contextId: "personal",
    intent: "scheduling_request",
    routedTo: "sinclair",
  },
  {
    id: "in-4",
    channel: "email",
    sender: "Stripe",
    subject: "Payout May 6",
    summary: "Routine payout notice — filed to FlourishED finance.",
    receivedLabel: "yesterday",
    contextId: "llc-flourished",
    intent: "informational",
    routedTo: "maxine",
  },
  {
    id: "in-5",
    channel: "linkedin",
    sender: "WBEZ producer",
    summary: "Podcast invite for May 28. Education-equity episode.",
    receivedLabel: "2d",
    contextId: "career",
    intent: "scheduling_request",
    routedTo: "khadijah",
  },
];
