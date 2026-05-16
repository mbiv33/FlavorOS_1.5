"use client";

import { Section } from "@/components/primitives/Section";
import { ApprovalsList } from "@/components/approval";
import { usePendingApprovals } from "@/lib/state/approvals";

/**
 * Today's "Ready for you" zone (PRD 04 §4.1). Renders Approval Cards in
 * compact mode. If there are no pending approvals, the section doesn't
 * render at all (PRD 00 §principle 2).
 */
export function ReadyForYou() {
  const approvals = usePendingApprovals();
  if (approvals.length === 0) return null;
  return (
    <Section
      title={`Ready for you · ${approvals.length}`}
      meta="↑↓ to navigate · Enter to approve · M modify · R do myself"
    >
      <ApprovalsList approvals={approvals} />
    </Section>
  );
}
