/*
 * Types backing the Today surface. Mirror the shapes a backend would emit;
 * the UI stays the same when real data lands.
 */

import type { PersonaId } from "./persona";

export type WellnessState = "steady" | "stretched" | "elevated";

export interface TodayStatus {
  wellness: WellnessState;
  /** Sentence for the status line, e.g. "Sinclair handled 14 things overnight". */
  overnight?: string;
  /** Sentence about brief readiness, e.g. "Khadijah's brief is ready". */
  brief?: string;
}

/** Master COS brief — synthesized from agent mini-briefs. */
export interface MasterBrief {
  attribution: string;
  paragraphs: string[];
  /** Drilldown links to per-project briefs in Library. */
  drillInto: { label: string; href: string }[];
  /** When the brief was last refreshed; rendered as "updated 6:42am". */
  updatedAt: string;
}

export type BriefingKind = "morning" | "cob" | "ad-hoc";

/**
 * Items that need client's input but aren't artifact-driven. Per PRD 03,
 * these never render as cards — they live in the briefing agenda preview
 * and Khadijah walks each at the call.
 */
export interface BriefingAgendaItem {
  id: string;
  text: string;
}

export interface UpcomingBriefing {
  kind: BriefingKind;
  /** Display label, e.g. "Morning briefing". */
  label: string;
  /** Human time string, e.g. "scheduled 7:30 AM". */
  scheduledLabel: string;
  /** Estimated duration label, e.g. "14 min est.". */
  durationLabel?: string;
  /** Hosts (typically Khadijah + Sinclair). */
  hosts: PersonaId[];
  items: BriefingAgendaItem[];
}

export type EventKind = "meeting" | "focus-block" | "personal" | "briefing";

export interface AgendaEvent {
  id: string;
  /** Pre-formatted time label like "10:00 AM" or "3:00 – 4:30 PM". */
  time: string;
  title: string;
  /** Context label or "held by Sinclair", "Personal", etc. */
  meta: string;
  kind: EventKind;
}

export type TripPhase = "planning" | "booking" | "prep" | "travel" | "return";

export interface UpcomingTrip {
  id: string;
  destination: string;
  /** Pretty date range, "June 14 — 22 · 8 nights". */
  dateRange: string;
  /** Days until trip start. Negative → in-progress; 0 → today; large → far. */
  daysUntil: number;
  phase: TripPhase;
  /** Plain-English phase status, e.g. "refining round 3". */
  phaseStatus: string;
}

export interface QuietlyHandled {
  /** Total count of items the system handled silently. */
  count: number;
  /** Optional preview lines shown when expanded. */
  items?: string[];
}
