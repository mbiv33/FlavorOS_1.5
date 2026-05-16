/*
 * Approval — the only user-facing decision shape in FlavorOS.
 * See PRD 03 (Approval Card) for full semantics.
 *
 * Sausage > sausage-making: this type intentionally has no skill name, no
 * routing metadata, no confidence scores, no PAC/PTQ/SIGMA references.
 * Anything an agent would store about its own work lives backend-side and is
 * never exposed here.
 */

import type { PersonaId } from "./persona";

export type ApprovalState =
  /** Drafted, awaiting client's call. */
  | "pending"
  /** client clicked Approve. May still be in pull-back window before send. */
  | "approved"
  /** client submitted Modify. Agent is reworking; a v2 card will land later. */
  | "revising"
  /** client chose to do it herself. Agent stops touching it. */
  | "doing-myself"
  /** Agent retracted before action (rare; surfaced briefly). */
  | "withdrawn"
  /** Card has fully aged out into the handled tray. */
  | "handled";

export type ArtifactType =
  | "email"
  | "sms"
  | "invoice"
  | "calendar-hold"
  | "booking"
  | "brief"
  | "follow-up";

/**
 * Conditional badges shown on the card. Only present when applicable —
 * undefined fields are not rendered.
 */
export interface Stakes {
  money?: string;
  /** "today", "Net 30", "expires Fri" */
  timeSensitive?: string;
  /** "to board member", "warm intro", or true for the generic chip */
  publicFacing?: string | true;
  irreversible?: boolean;
  highStakesRelationship?: boolean;
}

export interface PreviewRow {
  label: string;
  value: string;
}

export interface ArtifactPreview {
  type: ArtifactType;
  /** One-line summary of inbound that triggered this artifact (when relevant). */
  inboundSummary?: string;
  /** Key/value rows for invoice/booking-style artifacts. */
  rows?: PreviewRow[];
  /** Body text for emails / follow-ups / SMS. */
  body?: string;
}

export interface RippleNote {
  /** Plain-English cascade summary. Rendered as text; no markup. */
  text: string;
}

/** Adapts the third-button label so the verb is honest. PRD 03. */
export type DoMyselfLabel =
  | "I'll edit & send"
  | "I'll do it myself"
  | "I'll do myself"
  | "I'll handle it";

/** When N similar cards land in a window, group them into a single batch card. */
export interface BatchInfo {
  groupId: string;
  /** Short headline for the group, e.g. "drafted 3 follow-ups". */
  headline: string;
}

export interface Approval {
  id: string;
  state: ApprovalState;
  persona: PersonaId;
  /** Past-tense, completed-work verb: "drafted invoice", "curated booking bundle". */
  verb: string;
  /** What the verb acted on: "#247 to Acme", "Paris hotel + flight". */
  object: string;
  /** Context this artifact belongs to (id from getContexts()). */
  contextId: string;
  stakes: Stakes;
  preview: ArtifactPreview;
  /** Plain-English single block. Collapsed by default. */
  reasoning?: string;
  ripple?: RippleNote;
  /** Label of the third button. Falls back to "I'll do myself" if omitted. */
  doMyselfLabel?: DoMyselfLabel;
  /**
   * What the post-approve state shows. The system honors batching/scheduling
   * protocols (PRD 07); this is the user-facing summary, e.g.
   * "Approved — sending in next batch (4:00 PM)".
   */
  postApproveText?: string;
  /** Voice phrase the user can say to approve. PRD 03 §Voice. */
  voicePhrase?: string;
  batch?: BatchInfo;
  /** ISO timestamp the artifact landed. Used for sort + stale escalation. */
  createdAt: string;
}
