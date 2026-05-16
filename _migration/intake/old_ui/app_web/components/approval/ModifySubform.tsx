"use client";

import * as Checkbox from "@radix-ui/react-checkbox";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import {
  EMPTY_MODIFY,
  type ModifySelections,
} from "@/lib/state/approvals";
import type { Persona } from "@/lib/types/persona";

/**
 * Modify subform — three structured axes, multi-select, no free-text.
 * Submitting hands the artifact back for rework (PRD 03 §Modify subform).
 *
 * The 1-hour minimum and "when ready" copy reflect the no-instant-work
 * principle (PRD 00 §8). UI must not promise faster turnaround.
 */
export function ModifySubform({
  persona,
  onSubmit,
  onCancel,
}: {
  persona: Persona;
  onSubmit: (selections: ModifySelections) => void;
  onCancel: () => void;
}) {
  const [selections, setSelections] = useState<ModifySelections>(EMPTY_MODIFY);

  const update = <A extends keyof ModifySelections>(
    axis: A,
    key: keyof ModifySelections[A],
    value: boolean,
  ) => {
    setSelections((s) => ({
      ...s,
      [axis]: { ...s[axis], [key]: value },
    }));
  };

  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: "rgba(91,70,214,0.04)",
        borderTop: "1px solid rgba(91,70,214,0.15)",
      }}
    >
      <h4 className="m-0 mb-2.5 text-[12.5px] font-bold text-ink uppercase tracking-[0.04em]">
        What should we change?
      </h4>

      <Row label="Tone">
        <Opt
          checked={selections.tone.warmer}
          onChange={(v) => update("tone", "warmer", v)}
        >
          warmer
        </Opt>
        <Opt
          checked={selections.tone.moreProfessional}
          onChange={(v) => update("tone", "moreProfessional", v)}
        >
          more professional
        </Opt>
      </Row>

      <Row label="Format">
        <Opt
          checked={selections.format.narrative}
          onChange={(v) => update("format", "narrative", v)}
        >
          narrative
        </Opt>
        <Opt
          checked={selections.format.outline}
          onChange={(v) => update("format", "outline", v)}
        >
          outline
        </Opt>
      </Row>

      <Row label="Sender request">
        <Opt
          checked={selections.senderRequest.clarity}
          onChange={(v) => update("senderRequest", "clarity", v)}
        >
          clarity
        </Opt>
        <Opt
          checked={selections.senderRequest.additionalDetails}
          onChange={(v) => update("senderRequest", "additionalDetails", v)}
        >
          additional details
        </Opt>
      </Row>

      <p
        className="my-3 px-2.5 py-2 rounded-lg text-[12.5px] text-ink-2 leading-normal"
        style={{ background: "rgba(255,255,255,0.5)" }}
      >
        {persona.name} will rework using your preferences and bring it back
        when ready (usually same-day or next morning).
      </p>

      <div className="flex gap-1.5 justify-end pt-1">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSubmit(selections)}>
          Send for revision
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid items-center gap-2.5 py-1 text-[13px]"
      style={{ gridTemplateColumns: "110px 1fr" }}
    >
      <span className="text-ink-2 font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

function Opt({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md cursor-pointer text-[12.5px] text-ink-2 bg-card-solid border border-line-2 hover:bg-white/70"
    >
      <Checkbox.Root
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="w-3.5 h-3.5 rounded-[3px] border border-line-2 bg-white grid place-items-center data-[state=checked]:bg-accent data-[state=checked]:border-accent"
      >
        <Checkbox.Indicator className="text-white text-[10px] leading-none">
          ✓
        </Checkbox.Indicator>
      </Checkbox.Root>
      {children}
    </label>
  );
}
