"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { Chip } from "@/components/primitives/Chip";
import { Button } from "@/components/primitives/Button";
import { PERSONAS } from "@/lib/types/persona";
import { getContextById } from "@/lib/mock/profile";
import type { LibraryArtifact } from "@/lib/types/library";

interface ArtifactViewerProps {
  artifact: LibraryArtifact | null;
  onClose: () => void;
}

/**
 * Focused viewer (PRD 04 §4.6). Edit / Re-send / Versions affordances per
 * the spec; vocabulary is "edit" since the user is acting (the agent
 * "modifies" via the Modify subform, never the user).
 */
export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  return (
    <Dialog.Root open={!!artifact} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(720px,92vw)] max-h-[85vh] overflow-auto bg-card-solid border border-line rounded-card shadow-md2 p-6"
          aria-describedby={undefined}
        >
          {artifact ? <Body artifact={artifact} onClose={onClose} /> : null}
          <VisuallyHidden>
            <Dialog.Title>Artifact viewer</Dialog.Title>
          </VisuallyHidden>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Body({ artifact, onClose }: { artifact: LibraryArtifact; onClose: () => void }) {
  const persona = PERSONAS[artifact.attribution];
  const ctx = getContextById(artifact.contextId);
  return (
    <>
      <header className="flex items-start gap-3 mb-3">
        <PersonaAvatar persona={persona} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-bold tracking-tight">{artifact.title}</div>
          <div className="text-[12.5px] text-ink-3 mt-0.5">
            {persona.name} · {artifact.createdLabel}
            {artifact.status ? ` · ${artifact.status}` : ""}
          </div>
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="text-ink-3 hover:text-ink text-[20px] leading-none"
          >
            ×
          </button>
        </Dialog.Close>
      </header>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {ctx ? <Chip kind="context">{ctx.label}</Chip> : null}
        <Chip kind="neutral">{artifact.kind}</Chip>
      </div>

      {artifact.body ? (
        <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap m-0 mb-4">
          {artifact.body}
        </p>
      ) : null}

      {artifact.rows && artifact.rows.length > 0 ? (
        <div
          className="px-3.5 py-3 rounded-sm2 text-[13px] text-ink-2 mb-4"
          style={{
            background: "rgba(91,70,214,0.04)",
            border: "1px dashed rgba(91,70,214,0.18)",
          }}
        >
          {artifact.rows.map((row) => (
            <div key={row.label} className="flex justify-between py-px">
              <span className="text-ink-3">{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {artifact.versions && artifact.versions.length > 0 ? (
        <div className="text-[12.5px] text-ink-3 mb-4">
          Versions:{" "}
          {artifact.versions.map((v, i) => (
            <span key={v.id}>
              {i > 0 ? " · " : null}
              <button type="button" className="text-accent hover:underline">
                {v.label}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-1.5 justify-end pt-3 border-t border-line">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button>Re-send</Button>
        <Button variant="primary">Edit</Button>
      </div>
    </>
  );
}
