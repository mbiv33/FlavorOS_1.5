import type { PileMeta } from "./mappers";

export type ReportsPile = "reports" | "briefs" | "drafts";

export const REPORTS_PILE_ORDER: ReportsPile[] = ["reports", "briefs", "drafts"];

export const REPORTS_PILE_META: Record<ReportsPile, PileMeta> = {
  reports: {
    label: "Reports",
    tone: "violet",
    subtitle: "Formal reports across contexts",
  },
  briefs: {
    label: "Briefs",
    tone: "blue",
    subtitle: "Project & travel briefs",
  },
  drafts: {
    label: "Drafts",
    tone: "emerald",
    subtitle: "Outbound drafts in flight",
  },
};

export const REPORTS_STAT_LABELS = {
  pending: "Pending approval",
  ready: "Ready for review",
  drafts: "Draft artifacts",
  approved: "Filed",
};
