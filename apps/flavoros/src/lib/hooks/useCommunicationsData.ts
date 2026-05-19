"use client";

import {
  COMMS_PILE_META,
  COMMS_PILE_ORDER,
  COMMS_STAT_LABELS,
} from "@/lib/communications-config";
import {
  buildChannelStats,
  buildContactGroups,
  buildPileDefs,
} from "@/lib/mappers";
import type { ApprovalDecideRead } from "@/lib/api";
import { useChannelData } from "@/lib/hooks/useChannelData";

export function useCommunicationsData() {
  const {
    artifacts,
    approvals,
    outboundActions,
    inboxItems,
    loading,
    error,
    refresh,
    applyDecideResult,
  } = useChannelData();
  const piles = buildPileDefs(inboxItems, COMMS_PILE_ORDER, COMMS_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, COMMS_STAT_LABELS);
  const contactGroups = buildContactGroups(artifacts);

  function handleAfterDecide(result?: ApprovalDecideRead) {
    if (result) {
      applyDecideResult(result);
    }
    refresh();
  }

  return {
    piles,
    stats,
    contactGroups,
    outboundActions,
    loading,
    error,
    refresh,
    handleAfterDecide,
  };
}
