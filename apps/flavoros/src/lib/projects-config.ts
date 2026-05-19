import type { PileMeta } from "./mappers";

export type ProjectsPile = "active" | "blocked" | "completed";

export const PROJECTS_PILE_ORDER: ProjectsPile[] = ["active", "blocked", "completed"];

export const PROJECTS_PILE_META: Record<ProjectsPile, PileMeta> = {
  active: {
    label: "Active",
    tone: "amber",
    subtitle: "In progress · awaiting your input",
  },
  blocked: {
    label: "Blocked",
    tone: "rose",
    subtitle: "Held on missing input or external dependency",
  },
  completed: {
    label: "Completed",
    tone: "emerald",
    subtitle: "Shipped this quarter",
  },
};

export const PROJECTS_STAT_LABELS = {
  pending: "Open decisions",
  ready: "Needs review",
  drafts: "In progress",
  approved: "Completed",
};
