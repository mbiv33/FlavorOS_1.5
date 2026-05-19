"use client";

import {
  TRAVEL_PILE_META,
  TRAVEL_PILE_ORDER,
  TRAVEL_STAT_LABELS,
} from "@/lib/travel-config";
import {
  buildChannelStats,
  buildPileDefs,
  buildTripSummaries,
} from "@/lib/mappers";
import { useChannelData } from "@/lib/hooks/useChannelData";

export function useTravelData() {
  const { artifacts, approvals, inboxItems, loading, error } = useChannelData();
  const piles = buildPileDefs(inboxItems, TRAVEL_PILE_ORDER, TRAVEL_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, TRAVEL_STAT_LABELS);
  const trips = buildTripSummaries(artifacts);

  return { piles, stats, trips, loading, error };
}
