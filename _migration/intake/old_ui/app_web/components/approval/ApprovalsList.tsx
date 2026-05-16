"use client";

import { useEffect, useRef } from "react";
import { ApprovalCard } from "./ApprovalCard";
import { BatchCard } from "./BatchCard";
import type { Approval } from "@/lib/types/approval";

interface ApprovalsListProps {
  approvals: Approval[];
}

/**
 * Renders a vertical stack of Approval Cards. Groups by batch.groupId.
 * Provides ↑/↓ keyboard navigation between cards (PRD 03 §Keyboard
 * shortcuts — ↑↓ moves focus between cards).
 */
export function ApprovalsList({ approvals }: ApprovalsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const cards = Array.from(
        node.querySelectorAll<HTMLDivElement>('[role="group"][tabindex="0"]'),
      );
      const idx = cards.findIndex((c) => c === document.activeElement);
      if (idx === -1) return;
      const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
      if (next < 0 || next >= cards.length) return;
      e.preventDefault();
      cards[next].focus();
    };
    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, []);

  // Group consecutive approvals sharing a batch.groupId.
  type Group = { kind: "single"; item: Approval } | { kind: "batch"; items: Approval[] };
  const groups: Group[] = [];
  for (const a of approvals) {
    const groupId = a.batch?.groupId;
    if (groupId) {
      const last = groups[groups.length - 1];
      if (last && last.kind === "batch" && last.items[0].batch?.groupId === groupId) {
        last.items.push(a);
        continue;
      }
      groups.push({ kind: "batch", items: [a] });
    } else {
      groups.push({ kind: "single", item: a });
    }
  }

  return (
    <div ref={containerRef}>
      {groups.map((g, i) =>
        g.kind === "single" ? (
          <ApprovalCard key={g.item.id} approval={g.item} />
        ) : g.items.length === 1 ? (
          <ApprovalCard key={g.items[0].id} approval={g.items[0]} />
        ) : (
          <BatchCard key={`batch-${i}`} approvals={g.items} />
        ),
      )}
    </div>
  );
}
