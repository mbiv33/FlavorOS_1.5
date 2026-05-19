import type { ArtifactRead, ApprovalRead } from "./api";
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
