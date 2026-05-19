"use client";

import {
  CALENDAR_PILE_META,
  CALENDAR_PILE_ORDER,
  CALENDAR_STAT_LABELS,
} from "@/lib/calendar-config";
import type { ApprovalDecideRead } from "@/lib/api";
import {
  artifactHighlightDays,
  buildChannelStats,
  buildCurrentMonthGrid,
  buildPileDefs,
  mapInboxPileToSurface,
} from "@/lib/mappers";
import { useChannelData } from "@/lib/hooks/useChannelData";

const CALENDAR_PROVIDER = "googlecalendar";

export function useCalendarData() {
  const {
    artifacts,
    approvals,
    outboundActions: allOutbound,
    inboxItems,
    loading,
    error,
    refresh,
    applyDecideResult,
  } = useChannelData();
  const outboundActions = allOutbound.filter((o) => o.provider === CALENDAR_PROVIDER);
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

  function handleAfterDecide(result?: ApprovalDecideRead) {
    if (result) {
      applyDecideResult(result);
    }
    refresh();
  }

  return {
    piles,
    stats,
    month,
    highlightDates,
    todayItems,
    outboundActions,
    loading,
    error,
    refresh,
    handleAfterDecide,
  };
}
