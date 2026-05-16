"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApprovalsStore } from "@/lib/state/approvals";
import { useCallStore } from "@/lib/state/call";
import { usePaletteStore } from "@/lib/state/palette";
import { MOCK_LIBRARY } from "@/lib/mock/library";
import { MOCK_PROJECTS } from "@/lib/mock/projects";
import { PERSONAS } from "@/lib/types/persona";

/**
 * ⌘K palette. Search artifacts, projects, and run actions. Keyboard-first
 * power surface (PRD 04 §4.8). Voice equivalent: "FlavorOS, find …" /
 * "FlavorOS, jump to …" — wired through the voice phrase mapper.
 */
export function CommandPalette() {
  const open = usePaletteStore((s) => s.open);
  const setOpen = usePaletteStore((s) => s.setOpen);
  const toggle = usePaletteStore((s) => s.toggle);
  const router = useRouter();
  const approvals = useApprovalsStore((s) => s.approvals);
  const approve = useApprovalsStore((s) => s.approve);
  const startBriefing = useCallStore((s) => s.startMorningBriefing);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggle]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-[18vh] -translate-x-1/2 z-50 w-[min(640px,92vw)] bg-card-solid border border-line rounded-card shadow-md2 overflow-hidden"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <Dialog.Title>Command palette</Dialog.Title>
          </VisuallyHidden>
          <Command label="Command palette" className="font-sans">
            <Command.Input
              placeholder="Search or jump to…"
              className="w-full px-4 py-3.5 text-[14px] bg-transparent border-0 border-b border-line outline-none text-ink placeholder:text-ink-3"
            />
            <Command.List className="max-h-[400px] overflow-auto p-1.5">
              <Command.Empty className="px-4 py-3 text-[13px] text-ink-3">
                No matches.
              </Command.Empty>

              <Command.Group heading="Jump to">
                {[
                  { href: "/", label: "Today" },
                  { href: "/work", label: "Work" },
                  { href: "/work/travel", label: "Work › Travel" },
                  { href: "/messages", label: "Messages" },
                  { href: "/calendar", label: "Calendar" },
                  { href: "/library", label: "Library" },
                  { href: "/preferences", label: "Preferences" },
                ].map((n) => (
                  <PItem
                    key={n.href}
                    label={n.label}
                    onSelect={() => go(n.href)}
                  />
                ))}
              </Command.Group>

              <Command.Group heading="Actions">
                <PItem
                  label="Start morning briefing now"
                  onSelect={() => {
                    startBriefing();
                    setOpen(false);
                  }}
                />
              </Command.Group>

              {approvals.filter((a) => a.state === "pending").length > 0 ? (
                <Command.Group heading="Approve">
                  {approvals
                    .filter((a) => a.state === "pending")
                    .map((a) => {
                      const persona = PERSONAS[a.persona];
                      return (
                        <PItem
                          key={a.id}
                          label={`Approve ${a.object}`}
                          hint={`${persona.name} · ${a.verb}`}
                          onSelect={() => {
                            approve(a.id);
                            setOpen(false);
                          }}
                        />
                      );
                    })}
                </Command.Group>
              ) : null}

              <Command.Group heading="Projects">
                {MOCK_PROJECTS.map((p) => (
                  <PItem
                    key={p.id}
                    label={p.title}
                    hint={p.subtitle}
                    onSelect={() => go(`/work/${p.id}`)}
                  />
                ))}
              </Command.Group>

              <Command.Group heading="Library">
                {MOCK_LIBRARY.map((a) => (
                  <PItem
                    key={a.id}
                    label={a.title}
                    hint={`${PERSONAS[a.attribution].name} · ${a.kind}`}
                    onSelect={() => go("/library")}
                  />
                ))}
              </Command.Group>
            </Command.List>
            <div className="px-4 py-2 border-t border-line text-[11.5px] text-ink-3 flex items-center justify-between">
              <span>
                <span className="kbd">↑↓</span> navigate ·{" "}
                <span className="kbd">↵</span> select
              </span>
              <span>
                <span className="kbd">Esc</span> close
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PItem({
  label,
  hint,
  onSelect,
}: {
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${label} ${hint ?? ""}`}
      onSelect={onSelect}
      className="px-3 py-2 rounded-lg cursor-pointer text-[13.5px] text-ink data-[selected=true]:bg-[rgba(91,70,214,0.07)] data-[selected=true]:text-accent flex items-center gap-2"
    >
      <span>{label}</span>
      {hint ? (
        <span className="text-[12px] text-ink-3 truncate ml-auto">{hint}</span>
      ) : null}
    </Command.Item>
  );
}
