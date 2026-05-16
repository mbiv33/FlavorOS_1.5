import type { PersonaId } from "./persona";
import type { FileKind, ArtifactStatus } from "./project";

export interface LibraryArtifact {
  id: string;
  title: string;
  kind: FileKind;
  attribution: PersonaId;
  contextId: string;
  /** Project this artifact belongs to, if any. */
  projectId?: string;
  /** Pretty created label. */
  createdLabel: string;
  /** File send/status vocabulary shared with project artifacts. */
  status?: ArtifactStatus;
  /** Body content for the focused viewer. */
  body?: string;
  /** Optional structured rows (invoices, holds, etc). */
  rows?: { label: string; value: string }[];
  /** Older versions (Modify v1 → v2 chains). */
  versions?: { id: string; label: string }[];
}
