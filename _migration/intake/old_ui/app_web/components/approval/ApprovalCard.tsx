"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/primitives/Card";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { Chip } from "@/components/primitives/Chip";
import { Button } from "@/components/primitives/Button";
import { ArtifactPreview } from "./ArtifactPreview";
import { RipplePanel } from "./RipplePanel";
import { ModifySubform } from "./ModifySubform";
import { PostApproveBar } from "./PostApproveBar";
import {
  useApprovalsStore,
  type ModifySelections,
} from "@/lib/state/approvals";
import { PERSONAS } from "@/lib/types/persona";
import type { Approval } from "@/lib/types/approval";
import { getContextById } from "@/lib/mock/profile";
import { cn } from "@/lib/cn";

type Density = "compact" | "expanded";

interface ApprovalCardProps {
  approval: Approval;
  /** Initial density. Cards in feeds default compact; focused viewer expands. */
  initialDensity?: Density;
}

export function ApprovalCard({
  approval,
  initialDensity = "compact",
}: ApprovalCardProps) {
  const [density, setDensity] = useState<Density>(initialDensity);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const approve = useApprovalsStore((s) => s.approve);
  const submitModify = useApprovalsStore((s) => s.submitModify);
  const doMyself = useApprovalsStore((s) => s.doMyself);
  const pullBack = useApprovalsStore((s) => s.pullBack);

  const persona = PERSONAS[approval.persona];
  const ctx = getContextById(approval.contextId);

  // Keyboard shortcuts (PRD 03 §Keyboard shortcuts). Active only when a
  // descendant of this card has focus, so multiple cards on the same page
  // don't fight for the key. ↑↓ for prev/next is handled by the container.
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const handler = (e: KeyboardEvent) => {
      if (modifyOpen && e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      const inForm =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inForm) return;

      if (approval.state !== "pending") return;
      if (e.key === "Enter") {
        e.preventDefault();
        approve(approval.id);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setModifyOpen(true);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        doMyself(approval.id);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setDensity((d) => (d === "compact" ? "expanded" : "compact"));
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (modifyOpen) setModifyOpen(false);
        else (e.target as HTMLElement)?.blur?.();
      }
    };
    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [approval.id, approval.state, modifyOpen, approve, doMyself]);

  const isApproved = approval.state === "approved";
  const isRevising = approval.state === "revising";
  const isDoingMyself = approval.state === "doing-myself";

  return (
    <Card
      // Wrapper is a focus container so card-scoped shortcuts work.
      // tabIndex=0 lets users tab to it; clicking inside also focuses it.
      ref={cardRef}
      tabIndex={0}
      role="group"
      aria-label={`${persona.name} ${approval.verb} ${approval.object}`}
      className={cn(
        "mb-3 outline-none",
        isApproved &&
          "border-[rgba(63,154,126,0.3)] bg-gradient-to-b from-[rgba(63,154,126,0.04)] via-white to-white",
        "focus-within:ring-2 focus-within:ring-accent/40",
      )}
    >
      <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-1">
        <PersonaAvatar persona={persona} size="md" />
        <div className="font-semibold text-[13.5px] text-ink min-w-0 truncate">
          {persona.name}
          <span className="text-ink-3 font-medium mx-1.5">·</span>
          <span className="text-ink-3 font-medium">{approval.verb}</span>
          <span className="text-ink-3 font-medium mx-1.5">·</span>
          <span className="text-ink font-semibold">{approval.object}</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5 px-4 pt-1.5">
        {ctx ? <Chip kind="context">{ctx.label}</Chip> : null}
        {approval.stakes.money ? (
          <Chip kind="money">{approval.stakes.money}</Chip>
        ) : null}
        {approval.stakes.timeSensitive ? (
          <Chip kind="time">{approval.stakes.timeSensitive}</Chip>
        ) : null}
        {approval.stakes.publicFacing ? (
          <Chip kind="outbound">
            {approval.stakes.publicFacing === true
              ? "public-facing"
              : approval.stakes.publicFacing}
          </Chip>
        ) : null}
        {approval.stakes.irreversible ? (
          <Chip kind="irreversible">irreversible</Chip>
        ) : null}
        {approval.stakes.highStakesRelationship ? (
          <Chip kind="relationship">high-stakes</Chip>
        ) : null}
      </div>

      {density === "expanded" && approval.preview.inboundSummary ? (
        <p className="px-4 pt-2.5 text-[13.5px] text-ink-2">
          {approval.preview.inboundSummary}
        </p>
      ) : null}

      {density === "expanded" ? (
        <div className="px-4">
          <ArtifactPreview preview={approval.preview} />
        </div>
      ) : null}

      {density === "expanded" && approval.ripple ? (
        <RipplePanel note={approval.ripple} />
      ) : null}

      {density === "expanded" && approval.reasoning ? (
        <button
          type="button"
          onClick={() => setReasoningOpen((v) => !v)}
          className="w-full text-left px-4 py-2.5 border-t border-line text-ink-3 text-[12.5px] hover:bg-[rgba(31,29,43,0.02)]"
          aria-expanded={reasoningOpen}
        >
          {reasoningOpen ? "▾" : "▸"} Why
          {reasoningOpen ? (
            <p className="mt-2 text-ink-2 leading-relaxed">{approval.reasoning}</p>
          ) : null}
        </button>
      ) : null}

      {/* Status surfaces — replace decision row when card has been acted on */}
      {isApproved && approval.postApproveText ? (
        <PostApproveBar
          text={approval.postApproveText}
          onPullBack={() => pullBack(approval.id)}
        />
      ) : isRevising ? (
        <div
          className="px-4 py-3 text-[13px] text-ink-2 border-t border-line"
          style={{ background: "rgba(91,70,214,0.04)" }}
        >
          {persona.name} is reworking — back when ready (usually same-day or
          next morning).
        </div>
      ) : isDoingMyself ? (
        <div className="px-4 py-3 text-[13px] text-ink-2 border-t border-line">
          You took this one. {persona.name}'s draft is attached to the task.
        </div>
      ) : modifyOpen ? (
        <ModifySubform
          persona={persona}
          onCancel={() => setModifyOpen(false)}
          onSubmit={(selections: ModifySelections) => {
            submitModify(approval.id, selections);
            setModifyOpen(false);
          }}
        />
      ) : (
        <DecisionRow
          density={density}
          hasMore={
            density === "compact" &&
            (!!approval.reasoning ||
              !!approval.ripple ||
              !!approval.preview.body ||
              (approval.preview.rows?.length ?? 0) > 0 ||
              !!approval.preview.inboundSummary)
          }
          onExpand={() => setDensity("expanded")}
          onCollapse={() => setDensity("compact")}
          onApprove={() => approve(approval.id)}
          onModify={() => setModifyOpen(true)}
          onDoMyself={() => doMyself(approval.id)}
          doMyselfLabel={approval.doMyselfLabel ?? "I'll do myself"}
        />
      )}
    </Card>
  );
}

interface DecisionRowProps {
  density: Density;
  hasMore: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onApprove: () => void;
  onModify: () => void;
  onDoMyself: () => void;
  doMyselfLabel: string;
}

function DecisionRow({
  density,
  hasMore,
  onExpand,
  onCollapse,
  onApprove,
  onModify,
  onDoMyself,
  doMyselfLabel,
}: DecisionRowProps) {
  return (
    <div
      className="flex gap-1.5 items-center px-3 py-3 border-t border-line"
      style={{ background: "rgba(31,29,43,0.015)" }}
    >
      <Button variant="primary" onClick={onApprove}>
        ✓ Approve
      </Button>
      <Button onClick={onModify}>✎ Modify</Button>
      <Button variant="warn" onClick={onDoMyself}>
        ✕ {doMyselfLabel}
      </Button>
      {hasMore || density === "expanded" ? (
        <button
          type="button"
          onClick={density === "compact" ? onExpand : onCollapse}
          className="ml-auto text-[12px] text-ink-3 hover:text-ink-2 underline"
          aria-label={density === "compact" ? "Expand details" : "Collapse details"}
        >
          {density === "compact" ? "Show details" : "Hide details"}
        </button>
      ) : null}
    </div>
  );
}
