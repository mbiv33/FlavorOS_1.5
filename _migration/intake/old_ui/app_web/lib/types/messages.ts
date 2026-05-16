/*
 * Types backing the Messages surface. Mirror the shape produced by the
 * Universal Inbox Ingestion protocol (PRD 07).
 */

import type { PersonaId } from "./persona";

export interface TriageSummary {
  /** Total inbound items in the window. */
  total: number;
  /** Pretty timestamp, "6 minutes ago". */
  triagedLabel: string;
  /** Breakdown counts. Each row shows on the summary chip strip. */
  breakdown: TriageBreakdown[];
}

export interface TriageBreakdown {
  id: string;
  /** "ready for you" / "scheduling — Sinclair handling" / etc. */
  label: string;
  count: number;
  /** Whether this row should render in the alert color (typically the
   * "ready for you" row). */
  alert?: boolean;
}

export type OutboxKind = "email-batch" | "invoice" | "sms-batch" | "post";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  /** What's in the queued payload, e.g. "3 approved emails · NTC committee, …". */
  summary: string;
  /** When this is scheduled to fire, e.g. "4:00 PM batch", "tomorrow 9:00 AM". */
  scheduledLabel: string;
  /** Approval ids (or other refs) included in this outbox row, for pull-back. */
  refs?: string[];
}

export type ChannelId =
  | "all"
  | "email"
  | "sms"
  | "voicemail"
  | "linkedin"
  | "ig";

export interface Channel {
  id: ChannelId;
  label: string;
  /** Counts shown next to the label, optional. */
  count?: number;
}

export type Intent =
  | "scheduling_request"
  | "action_required"
  | "informational"
  | "relationship"
  | "newsletter";

export interface InboxItem {
  id: string;
  channel: ChannelId;
  sender: string;
  subject?: string;
  /** Body summary line, plain English. */
  summary: string;
  /** Pretty timestamp, "2h", "yesterday". */
  receivedLabel: string;
  contextId: string;
  intent: Intent;
  /** Persona handling this item. */
  routedTo?: PersonaId;
  /** Optional source URL (Gmail/O365 link) — opens raw item in new tab. */
  sourceUri?: string;
}
