import Link from "next/link";
import { Section } from "@/components/primitives/Section";
import { Card } from "@/components/primitives/Card";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { PERSONAS } from "@/lib/types/persona";
import { MOCK_BRIEF } from "@/lib/mock/today";

/**
 * Khadijah's master COS brief. Synthesized from per-agent mini-briefs.
 * Drilldown links open per-project briefs in Library (PRD 04 §4.1).
 */
export function KhadijahsBrief() {
  const brief = MOCK_BRIEF;
  const khadijah = PERSONAS.khadijah;

  return (
    <Section title="Khadijah's brief" meta={`updated ${brief.updatedAt}`}>
      <Card className="p-5">
        <div className="flex items-center gap-2 text-[12px] text-ink-3 mb-2.5">
          <PersonaAvatar persona={khadijah} size="sm" />
          {brief.attribution}
        </div>
        {brief.paragraphs.map((p, i) => (
          <p key={i} className="m-0 mb-2.5 text-[14.5px] leading-relaxed text-ink last:mb-0">
            {p}
          </p>
        ))}
        {brief.drillInto.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-2 border-t border-line text-[12.5px] text-ink-3">
            Drill into:
            {brief.drillInto.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="text-accent no-underline font-medium px-2 py-0.5 rounded-md bg-[rgba(91,70,214,0.06)] hover:bg-[rgba(91,70,214,0.12)]"
              >
                {d.label}
              </Link>
            ))}
          </div>
        ) : null}
      </Card>
    </Section>
  );
}
