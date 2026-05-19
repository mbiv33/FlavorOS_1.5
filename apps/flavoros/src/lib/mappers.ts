import type { ArtifactRead, ApprovalRead } from "./api";
import type {
  BriefingDefinition,
  BriefingPreparedStatus,
  BriefingType,
} from "./briefings-config";
import { BRIEFING_DEFINITIONS } from "./briefings-config";
import type { InboxItem, InboxPile, CardStatus } from "./fixtures";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function humanizeAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function approvalToInboxItem(approval: ApprovalRead): InboxItem {
  return {
    id: `approval-${approval.id}`,
    pile: "urgent",
    kind: "approval",
    title: humanizeAction(approval.governed_action),
    status: "Ready to approve" as CardStatus,
    agent: "Khadijah",
    detail: approval.reason ?? "Pending your decision",
    when: relativeTime(approval.created_at),
    approvalId: approval.id,
  };
}

function artifactPile(artifact: ArtifactRead): InboxPile {
  if (artifact.kind === "sigma" || artifact.status === "approved") return "updates";
  if (artifact.status === "ready") return "needs-attention";
  return "updates";
}

function artifactCardStatus(artifact: ArtifactRead): CardStatus {
  if (artifact.status === "approved") return "Completed";
  if (artifact.status === "ready") return "Needs review";
  if (artifact.status === "draft") return "Draft ready";
  return "Completed";
}

export function artifactToInboxItem(artifact: ArtifactRead): InboxItem {
  const pile = artifactPile(artifact);
  return {
    id: `artifact-${artifact.id}`,
    pile,
    kind: pile === "updates" ? "update" : "approval",
    title: artifact.title,
    status: artifactCardStatus(artifact),
    agent: "Khadijah",
    detail: artifact.body?.slice(0, 80) ?? "",
    when: relativeTime(artifact.updated_at),
  };
}

export function buildGreeting(displayName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = displayName.split(" ")[0];
  return `Good ${part}, ${firstName}.`;
}

export function todayDateLine(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export type BriefingSummary = BriefingDefinition & {
  type: BriefingType;
  preparedStatus: BriefingPreparedStatus;
  topicCount: number;
  approvalCount: number;
};

function deriveBriefingPreparedStatus(
  artifacts: ArtifactRead[],
  pendingApprovalCount: number,
): BriefingPreparedStatus {
  if (pendingApprovalCount > 0) return "ready";
  if (artifacts.some((a) => a.status === "ready")) return "ready";
  if (artifacts.some((a) => a.status === "draft")) return "in_progress";
  if (artifacts.some((a) => a.status === "approved")) return "completed";
  return "not_prepared";
}

export function buildBriefingSummaries(
  artifacts: ArtifactRead[],
  approvals: ApprovalRead[],
): BriefingSummary[] {
  const pendingApprovalCount = approvals.length;
  const preparedStatus = deriveBriefingPreparedStatus(
    artifacts,
    pendingApprovalCount,
  );
  const topicCount = artifacts.length;

  return (Object.keys(BRIEFING_DEFINITIONS) as BriefingType[]).map((type) => ({
    type,
    ...BRIEFING_DEFINITIONS[type],
    preparedStatus,
    topicCount,
    approvalCount: pendingApprovalCount,
  }));
}

/** Items for briefing detail: pending approvals first, then actionable artifacts. */
export function briefingAttentionItems(
  artifacts: ArtifactRead[],
  approvals: ApprovalRead[],
): InboxItem[] {
  const items: InboxItem[] = [
    ...approvals.map(approvalToInboxItem),
    ...artifacts
      .filter((a) => a.status === "ready" || a.status === "draft")
      .map(artifactToInboxItem),
  ];
  return items.slice(0, 6);
}
