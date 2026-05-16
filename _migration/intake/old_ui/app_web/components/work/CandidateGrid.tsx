import { Section } from "@/components/primitives/Section";
import type { Candidate } from "@/lib/types/project";

interface CandidateGridProps {
  candidates: Candidate[];
  meta?: string;
}

export function CandidateGrid({ candidates, meta }: CandidateGridProps) {
  if (candidates.length === 0) return null;
  return (
    <Section title="Current candidates" meta={meta}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {candidates.map((c) => (
          <div key={c.id} className="bg-card-solid border border-line rounded-xl p-3.5 text-[13px]">
            <div className="font-semibold text-[14px]">{c.name}</div>
            <div className="text-ink-3 text-[12px] mt-0.5">{c.meta}</div>
            {c.price ? (
              <div className="text-max font-bold mt-2">{c.price}</div>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}
