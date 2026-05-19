import type { PileListItem } from "@/components/PileItemList";
import type { PileDef, PileTone } from "@/components/PileRow";
import type { Stat, StatTone } from "@/components/StatStrip";

import type { ArtifactRead, ApprovalRead, OutboundActionRead, OutboundStatus } from "./api";
import type {
  BriefingDefinition,
  BriefingPreparedStatus,
  BriefingType,
} from "./briefings-config";
import { BRIEFING_DEFINITIONS } from "./briefings-config";
import type { InboxItem, InboxPile, CardStatus } from "./fixtures";

export function relativeTime(iso: string): string {
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

export function mapOutboundStatusToChip(status: OutboundStatus): CardStatus {
  switch (status) {
    case "queued":
      return "Queued";
    case "executed":
      return "Sent";
    case "failed":
      return "Failed";
    case "pulled_back":
      return "Pulled back";
    default:
      return "In progress";
  }
}

export function enrichInboxItemsWithOutbound(
  items: InboxItem[],
  outboundByApprovalId: Map<string, OutboundActionRead>,
): InboxItem[] {
  return items.map((item) => {
    if (!item.approvalId) return item;
    const outbound = outboundByApprovalId.get(item.approvalId);
    if (!outbound) return item;
    return {
      ...item,
      status: mapOutboundStatusToChip(outbound.status),
      detail:
        outbound.last_error_summary ??
        item.detail ??
        `Outbound ${outbound.status}`,
      when: relativeTime(outbound.updated_at),
    };
  });
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

export type PileMeta = {
  label: string;
  tone: PileTone;
  subtitle: string;
};

const INBOX_PILE_ORDER: InboxPile[] = ["urgent", "needs-attention", "updates"];

/** Map API inbox pile to a surface-specific pile key (same order as typical 3-pile surfaces). */
export function mapInboxPileToSurface<K extends string>(
  item: InboxItem,
  pileOrder: readonly K[],
): K {
  const idx = INBOX_PILE_ORDER.indexOf(item.pile);
  const safeIdx = idx < 0 ? pileOrder.length - 1 : Math.min(idx, pileOrder.length - 1);
  return pileOrder[safeIdx];
}

export function inboxItemToPileListItem(item: InboxItem): PileListItem {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    status: item.status,
    agent: item.agent,
    detail: item.detail,
    when: item.when,
    canDefer: item.canDefer,
    sourceLinkLabel: item.sourceLinkLabel,
    approvalId: item.approvalId,
  };
}

export function buildPileDefs<K extends string>(
  items: InboxItem[],
  pileOrder: readonly K[],
  pileMeta: Record<K, PileMeta>,
): PileDef[] {
  return pileOrder.map((key) => {
    const meta = pileMeta[key];
    const pileItems = items
      .filter((item) => mapInboxPileToSurface(item, pileOrder) === key)
      .map(inboxItemToPileListItem);
    return {
      key,
      label: meta.label,
      tone: meta.tone,
      subtitle: meta.subtitle,
      items: pileItems,
    };
  });
}

export type ChannelStatLabels = {
  pending?: string;
  ready?: string;
  drafts?: string;
  approved?: string;
};

export function buildChannelStats(
  artifacts: ArtifactRead[],
  approvals: ApprovalRead[],
  labels?: ChannelStatLabels,
): Stat[] {
  const pending = approvals.length;
  const ready = artifacts.filter((a) => a.status === "ready").length;
  const drafts = artifacts.filter((a) => a.status === "draft").length;
  const approved = artifacts.filter((a) => a.status === "approved").length;

  const stat = (
    id: string,
    label: string,
    value: number,
    tone: StatTone,
  ): Stat => ({ id, label, value: String(value), tone });

  return [
    stat(
      "pending",
      labels?.pending ?? "Pending approvals",
      pending,
      pending > 0 ? "attention" : "ok",
    ),
    stat(
      "ready",
      labels?.ready ?? "Ready for review",
      ready,
      ready > 0 ? "attention" : "ok",
    ),
    stat(
      "drafts",
      labels?.drafts ?? "Drafts",
      drafts,
      drafts > 0 ? "neutral" : "ok",
    ),
    stat(
      "approved",
      labels?.approved ?? "Approved",
      approved,
      approved > 0 ? "ok" : "neutral",
    ),
  ];
}

export function artifactHighlightDays(artifacts: ArtifactRead[]): number[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const days = new Set<number>();
  for (const a of artifacts) {
    const d = new Date(a.updated_at);
    if (d.getMonth() === month && d.getFullYear() === year) {
      days.add(d.getDate());
    }
  }
  return [...days].sort((a, b) => a - b);
}

export function buildCurrentMonthGrid(): {
  label: string;
  weekdays: string[];
  weeks: Array<Array<number | null>>;
  today: number;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const label = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdays = ["S", "M", "T", "W", "Th", "F", "S"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return { label, weekdays, weeks, today: now.getDate() };
}

export type GoalChip = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StatTone;
};

/** Milestone chips from live artifacts; empty when none. */
export function buildGoalChips(artifacts: ArtifactRead[]): GoalChip[] {
  const actionable = artifacts.filter(
    (a) => a.status === "ready" || a.status === "draft" || a.status === "approved",
  );
  if (actionable.length === 0) return [];

  return actionable.slice(0, 4).map((a) => {
    let tone: StatTone = "ok";
    if (a.status === "ready") tone = "attention";
    if (a.status === "draft") tone = "neutral";
    return {
      id: a.id,
      label: a.title.slice(0, 28),
      value: a.status === "approved" ? "Done" : a.status,
      detail: relativeTime(a.updated_at),
      tone,
    };
  });
}

export type ContactGroup = {
  context: string;
  contacts: { id: string; name: string; meta: string }[];
};

export type TripSummary = {
  id: string;
  title: string;
  phase: string;
  when: string;
  summary: string;
};

export function buildTripSummaries(artifacts: ArtifactRead[]): TripSummary[] {
  if (artifacts.length === 0) return [];
  return artifacts.slice(0, 4).map((a) => ({
    id: a.id,
    title: a.title.slice(0, 48),
    phase: a.status,
    when: relativeTime(a.updated_at),
    summary: a.body?.slice(0, 120) ?? "Synced from your connected providers.",
  }));
}

export function buildContactGroups(artifacts: ArtifactRead[]): ContactGroup[] {
  if (artifacts.length === 0) return [];
  const recent = artifacts.slice(0, 6).map((a, i) => ({
    id: `contact-${a.id}`,
    name: a.title.slice(0, 40),
    meta: `${a.kind} · ${relativeTime(a.updated_at)}`,
  }));
  return [{ context: "Recent sync", contacts: recent }];
}
