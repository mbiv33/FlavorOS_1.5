"use client";

import { Section } from "@/components/primitives/Section";
import { Card } from "@/components/primitives/Card";
import { PairAvatar, PersonaAvatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { PERSONAS, type PersonaId } from "@/lib/types/persona";
import { MOCK_UPCOMING_BRIEFING } from "@/lib/mock/today";
import { useCallStore } from "@/lib/state/call";

/**
 * Briefing agenda preview. PRD 03 + 04: items that need client input but
 * aren't artifact-driven live here, *not* as cards. Khadijah walks each at
 * the call. "Start morning briefing now" launches the Call Surface.
 */
export function BriefingAgendaPreview() {
  const briefing = MOCK_UPCOMING_BRIEFING;
  const start = useCallStore((s) => s.startMorningBriefing);
  if (briefing.items.length === 0) return null;

  return (
    <Section
      title={`On the next briefing agenda · ${briefing.items.length}`}
      meta="decisions Khadijah will walk with you"
    >
      <Card className="p-5">
        <header className="flex items-center gap-2.5 mb-3">
          <Hosts hosts={briefing.hosts} />
          <div className="font-semibold text-[13px]">{briefing.label}</div>
          <div className="ml-auto text-[12px] text-ink-3">
            {briefing.scheduledLabel}
            {briefing.durationLabel ? ` · ${briefing.durationLabel}` : null}
          </div>
        </header>

        <ul className="list-none p-0 m-0 mb-3">
          {briefing.items.map((it, i) => (
            <li
              key={it.id}
              className={`py-2 text-[13.5px] text-ink-2 flex items-start gap-2 ${i < briefing.items.length - 1 ? "border-b border-dashed border-line" : ""}`}
            >
              <span className="text-ink-3 text-[14px] leading-none mt-0.5" aria-hidden>○</span>
              {it.text}
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2 border-t border-line">
          <Button variant="primary" onClick={start}>
            ▶ Start morning briefing now
          </Button>
          <Button>Reschedule</Button>
        </div>
      </Card>
    </Section>
  );
}

function Hosts({ hosts }: { hosts: PersonaId[] }) {
  if (hosts.length >= 2) {
    return <PairAvatar personas={[PERSONAS[hosts[0]], PERSONAS[hosts[1]]]} />;
  }
  return <PersonaAvatar persona={PERSONAS[hosts[0]]} size="sm" />;
}
