import type { PileMeta } from "./mappers";

export type TravelPile = "decisions" | "research" | "itineraries";

export const TRAVEL_PILE_ORDER: TravelPile[] = ["decisions", "research", "itineraries"];

export const TRAVEL_PILE_META: Record<TravelPile, PileMeta> = {
  decisions: {
    label: "Decisions",
    tone: "violet",
    subtitle: "Travel options awaiting your choice",
  },
  research: {
    label: "Research",
    tone: "blue",
    subtitle: "Background prep, ready when you are",
  },
  itineraries: {
    label: "Itineraries",
    tone: "emerald",
    subtitle: "Itinerary drafts and finals",
  },
};

export const TRAVEL_STAT_LABELS = {
  pending: "Booking approvals",
  ready: "Options to compare",
  drafts: "Itinerary drafts",
  approved: "Confirmed trips",
};
