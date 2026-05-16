/*
 * Right-rail chat threads. Three only — Group, Sinclair, Khadijah — and
 * the user can never add more (PRD 06).
 */

import type { PersonaId } from "./persona";

export type ThreadId = "group" | "sinclair" | "khadijah";

export interface Thread {
  id: ThreadId;
  label: string;
  /** Personas present in this thread. Group has both. */
  personas: PersonaId[];
  /** Composer placeholder when this is the active thread. */
  composerPlaceholder: string;
}

export type MessageAuthor = "user" | PersonaId;

export interface ChatMessage {
  id: string;
  threadId: ThreadId;
  author: MessageAuthor;
  body: string;
  /** Pretty timestamp ("just now", "12m"). */
  timestampLabel: string;
}
