/*
 * Call surface — Scheduled-interaction container. PRD 05.
 */

import type { PersonaId } from "./persona";

export type AgendaItemState = "done" | "active" | "todo" | "deferred" | "skipped";

export interface CallAgendaItem {
  id: string;
  text: string;
  state: AgendaItemState;
}

export type TranscriptKind = "speech" | "note" | "decision";

export interface TranscriptLine {
  id: string;
  /** "khadijah" / "sinclair" / "user". */
  speaker: PersonaId | "user";
  /** Whether this line is dialogue, an inline note, or a captured decision. */
  kind: TranscriptKind;
  text: string;
}

export type CallKind = "morning-briefing" | "cob" | "ad-hoc" | "wellness";

export interface ActiveCall {
  kind: CallKind;
  /** Display label for the header. */
  label: string;
  /** Personas hosting. Wellness deeper check-ins are Sinclair-only. */
  hosts: PersonaId[];
  /** Currently speaking persona. The orb pulses with their color. */
  speaking?: PersonaId;
  agenda: CallAgendaItem[];
  transcript: TranscriptLine[];
  /** Seconds since the call began; rendered as 4:12 etc. */
  elapsedSeconds: number;
  /** Whether mic is hard-muted. */
  muted: boolean;
  /** Whether the call is paused. */
  paused: boolean;
}
