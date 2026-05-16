"use client";

import { useState } from "react";
import { Card } from "@/components/primitives/Card";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { ApprovalCard } from "./ApprovalCard";
import { useApprovalsStore } from "@/lib/state/approvals";
import { PERSONAS } from "@/lib/types/persona";
import type { Approval } from "@/lib/types/approval";

interface BatchCardProps {
  approvals: Approval[];
}

/**
 * Batch card — renders when N similar cards land in a window. PRD 03 §Bulk.
 * Approve all / Reject all act on each via the store. Review each expands
 * to per-card.
 */
export function BatchCard({ approvals }: BatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const approve = useApprovalsStore((s) => s.approve);
  const doMyself = useApprovalsStore((s) => s.doMyself);

  if (approvals.length === 0) return null;
  const persona = PERSONAS[approvals[0].persona];
  const headline = approvals[0].batch?.headline ?? `${approvals.length} items`;

  if (expanded) {
    return (
      <div>
        <header className="flex items-center gap-2.5 px-1 pb-2">
          <PersonaAvatar persona={persona} size="md" />
          <div className="text-[13.5px] font-semibold">
            {persona.name}
            <span className="text-ink-3 mx-1.5">·</span>
            <span className="text-ink-3">{headline}</span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-auto text-[12px] text-ink-3 underline hover:text-ink-2"
          >
            Collapse batch
          </button>
        </header>
        {approvals.map((a) => (
          <ApprovalCard key={a.id} approval={a} />
        ))}
      </div>
    );
  }

  return (
    <Card className="mb-3">
      <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-1">
        <PersonaAvatar persona={persona} size="md" />
        <div className="font-semibold text-[13.5px]">
          {persona.name}
          <span className="text-ink-3 font-medium mx-1.5">·</span>
          <span className="text-ink-3 font-medium">{headline}</span>
        </div>
      </header>
      <div
        className="flex gap-1.5 items-center px-3 py-3 mt-2 border-t border-line"
        style={{ background: "rgba(31,29,43,0.015)" }}
      >
        <Button onClick={() => setExpanded(true)}>Review each ▾</Button>
        <Button
          variant="primary"
          onClick={() => approvals.forEach((a) => approve(a.id))}
        >
          ✓ Approve all
        </Button>
        <Button
          variant="warn"
          onClick={() => approvals.forEach((a) => doMyself(a.id))}
        >
          ✕ Reject all
        </Button>
      </div>
    </Card>
  );
}
