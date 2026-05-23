"use client";

import { useEffect, useState } from "react";

import {
  COMMS_PILE_META,
  COMMS_PILE_ORDER,
  COMMS_STAT_LABELS,
} from "@/lib/communications-config";
import {
  buildChannelStats,
  buildCommunicationsInboxItems,
  buildContactGroups,
  buildPileDefs,
} from "@/lib/mappers";
import {
  listArtifacts,
  listApprovals,
  listNormalizedItems,
  listOutboundActions,
  loadSession,
  type ApprovalDecideRead,
  type ApprovalRead,
  type ArtifactRead,
  type NormalizedItemRead,
  type OutboundActionRead,
} from "@/lib/api";
import type { InboxItem } from "@/lib/fixtures";

export function useCommunicationsData() {
  const [artifacts, setArtifacts] = useState<ArtifactRead[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRead[]>([]);
  const [outboundActions, setOutboundActions] = useState<OutboundActionRead[]>([]);
  const [normalizedItems, setNormalizedItems] = useState<NormalizedItemRead[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function rebuildInbox(
    artifactList: ArtifactRead[],
    approvalList: ApprovalRead[],
    outboundList: OutboundActionRead[],
    normalized: NormalizedItemRead[],
  ) {
    setInboxItems(
      buildCommunicationsInboxItems(
        artifactList,
        approvalList,
        outboundList,
        normalized,
      ),
    );
  }

  function applyDecideResult(result: ApprovalDecideRead) {
    setApprovals((prevApprovals) => {
      const nextApprovals = prevApprovals.filter((a) => a.id !== result.id);
      setOutboundActions((prevOutbound) => {
        let nextOutbound = prevOutbound;
        if (result.outbound_action) {
          const outbound = result.outbound_action;
          const idx = prevOutbound.findIndex((o) => o.id === outbound.id);
          nextOutbound =
            idx >= 0
              ? prevOutbound.map((o, i) => (i === idx ? outbound : o))
              : [...prevOutbound, outbound];
        }
        setArtifacts((artifactList) => {
          setNormalizedItems((normalized) => {
            rebuildInbox(artifactList, nextApprovals, nextOutbound, normalized);
            return normalized;
          });
          return artifactList;
        });
        return nextOutbound;
      });
      return nextApprovals;
    });
  }

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      listArtifacts(session),
      listApprovals(session, "pending"),
      listOutboundActions(session),
      listNormalizedItems(session, { item_type: "email", limit: 100 }),
    ])
      .then(([artifactList, approvalList, outboundList, normalizedList]) => {
        setArtifacts(artifactList);
        setApprovals(approvalList);
        setOutboundActions(outboundList);
        setNormalizedItems(normalizedList);
        rebuildInbox(artifactList, approvalList, outboundList, normalizedList);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load communications");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const piles = buildPileDefs(inboxItems, COMMS_PILE_ORDER, COMMS_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, COMMS_STAT_LABELS);
  const contactGroups = buildContactGroups(artifacts);

  function handleAfterDecide(result?: ApprovalDecideRead) {
    if (result) {
      applyDecideResult(result);
    }
  }

  return {
    piles,
    stats,
    contactGroups,
    outboundActions,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
    handleAfterDecide,
  };
}
