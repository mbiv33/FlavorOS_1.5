/*
 * Project = a unit of work Maxine has spun up. The client never creates these.
 * No "+ New Project" affordance anywhere (PRD 02 §Why "Work").
 */

import type { PersonaId } from "./persona";
import type { TripPhase } from "./today";

export type ProjectKind = "travel" | "standard";
export type ProjectStatus = "active" | "stalled" | "completed";

export type FileKind =
  | "draft"
  | "brief"
  | "packet"
  | "invoice"
  | "contract"
  | "debrief"
  | "research"
  | "tee-up";

export type ArtifactStatus =
  | "sent"
  | "queued"
  | "superseded"
  | "final"
  | "archived";

export type ProjectFileStatus = ArtifactStatus;

export interface ProjectFile {
  id: string;
  title: string;
  kind: FileKind;
  attribution: PersonaId;
  /** Pretty date, "May 7". */
  createdLabel: string;
  /** File send/status vocabulary shared with library artifacts. */
  status?: ArtifactStatus;
}

/**
 * User-facing decision kinds. `briefing-decision` is a UI surface-only label
 * for choices made during a call; backend storage can normalize it to an
 * approved/modified decision with `source_surface: call`.
 */
export type DecisionKind =
  | "approved"
  | "modified"
  | "do-myself"
  | "briefing-decision";

export interface ProjectDecision {
  id: string;
  /** Pretty date, "May 7". */
  dateLabel: string;
  text: string;
  kind: DecisionKind;
}

export interface PhaseSnapshot {
  /** Active phase. */
  current: TripPhase;
  /** Plain-English status of the current phase. */
  statusLabel: string;
}

export interface TimelineEntry {
  id: string;
  /** Pretty date, "May 5", "today", "~May 19". */
  dateLabel: string;
  text: string;
  /** Optional quoted line for direction-giving moments. */
  quote?: string;
  state: "past" | "now" | "future";
}

export interface Candidate {
  id: string;
  name: string;
  meta: string;
  /** Pre-formatted price, "$272/night". */
  price?: string;
}

export interface Project {
  id: string;
  kind: ProjectKind;
  status: ProjectStatus;
  /** Display title. */
  title: string;
  /** Subtitle / longer label. */
  subtitle?: string;
  contextId: string;
  /** Status sentence, plain English. PRD 04 §4.2. */
  statusSentence: string;
  /** Next milestone label, e.g. "Final tee-up ~May 19". */
  nextMilestone?: string;
  /** Phase snapshot for travel projects (and any other multi-phase projects). */
  phase?: PhaseSnapshot;
  /** Days-until countdown for travel projects. */
  daysUntil?: number;
  /** Pretty date or date range for the project's anchor (trip date, deadline). */
  anchorLabel?: string;
  /** Khadijah's per-project mini-brief paragraphs. */
  briefParagraphs?: string[];
  /** Client's decisions on this project, chronological. */
  decisions: ProjectDecision[];
  files: ProjectFile[];
  timeline?: TimelineEntry[];
  candidates?: Candidate[];
}
