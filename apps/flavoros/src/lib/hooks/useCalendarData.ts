"use client";

import {
  CALENDAR_PILE_META,
  CALENDAR_PILE_ORDER,
  CALENDAR_STAT_LABELS,
} from "@/lib/calendar-config";
import {
  artifactHighlightDays,
  buildChannelStats,
  buildCurrentMonthGrid,
  buildPileDefs,
  mapInboxPileToSurface,
} from "@/lib/mappers";
import { useChannelData } from "@/lib/hooks/useChannelData";

export function useCalendarData() {
  const { artifacts, approvals, inboxItems, loading, error } = useChannelData();
  const piles = buildPileDefs(inboxItems, CALENDAR_PILE_ORDER, CALENDAR_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, CALENDAR_STAT_LABELS);
  const month = buildCurrentMonthGrid();
  const highlightDates = artifactHighlightDays(artifacts);
  const todayItems = inboxItems
    .filter((item) => mapInboxPileToSurface(item, CALENDAR_PILE_ORDER) === "today")
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
    }));

  return {
    piles,
    stats,
    month,
    highlightDates,
    todayItems,
    loading,
    error,
  };
}
