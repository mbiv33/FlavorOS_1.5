import type { PersonaId } from "./persona";

export type CalEventKind =
  | "meeting"
  | "focus-block"
  | "personal"
  | "briefing"
  | "travel-day";

export interface CalEvent {
  id: string;
  title: string;
  /** ISO start/end. */
  start: string;
  end: string;
  contextId?: string;
  /** Project this event belongs to, if any. Click jumps to project Status. */
  projectId?: string;
  kind: CalEventKind;
  /** For briefings, who hosts (typically Khadijah + Sinclair). */
  hosts?: PersonaId[];
  /** True for Sinclair-managed holds (rendered with dotted accent). */
  held?: boolean;
}
