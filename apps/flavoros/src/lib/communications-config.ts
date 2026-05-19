import type { PileMeta } from "./mappers";

export type CommsPile = "emails" | "sms-voice" | "social";

export const COMMS_PILE_ORDER: CommsPile[] = ["emails", "sms-voice", "social"];

export const COMMS_PILE_META: Record<CommsPile, PileMeta> = {
  emails: {
    label: "Emails",
    tone: "violet",
    subtitle: "Inbound and drafts via Gmail",
  },
  "sms-voice": {
    label: "SMS & Voice",
    tone: "blue",
    subtitle: "Text and voice channels",
  },
  social: {
    label: "Social",
    tone: "emerald",
    subtitle: "Selected DMs across social channels",
  },
};

export const COMMS_STAT_LABELS = {
  pending: "Awaiting approval",
  ready: "Ready to review",
  drafts: "Drafts in flight",
  approved: "Sent / filed",
};
