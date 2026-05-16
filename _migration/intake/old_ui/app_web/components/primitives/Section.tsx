import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionProps {
  /** Section heading. Rendered as small, uppercase tracking-wide label. */
  title: string;
  /** Right-aligned meta line (counts, voice phrase hint, timestamps). */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard center-pane section. Per PRD principle 2 ("silence equals working"),
 * if children resolves to nothing, the caller should not render a Section at
 * all — empty Sections must not appear in the DOM.
 */
export function Section({ title, meta, children, className }: SectionProps) {
  return (
    <section className={cn("mt-[22px]", className)}>
      <header className="flex items-baseline justify-between px-1 pb-2.5">
        <h2 className="m-0 text-[11.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">
          {title}
        </h2>
        {meta ? <span className="text-[12px] text-ink-3">{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}
