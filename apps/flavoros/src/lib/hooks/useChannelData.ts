"use client";

import { useEffect, useState } from "react";

import {
  listArtifacts,
  listApprovals,
  listOutboundActions,
  loadSession,
  type ApprovalDecideRead,
  type ArtifactRead,
  type ApprovalRead,
  type OutboundActionRead,
} from "@/lib/api";
import { buildInboxItems } from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

export type ChannelData = {
  artifacts: ArtifactRead[];
  approvals: ApprovalRead[];
  outboundActions: OutboundActionRead[];
  inboxItems: InboxItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  applyDecideResult: (result: ApprovalDecideRead) => void;
};

export function useChannelData(): ChannelData {
  const [artifacts, setArtifacts] = useState<ArtifactRead[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRead[]>([]);
  const [outboundActions, setOutboundActions] = useState<OutboundActionRead[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        setArtifacts((artifacts) => {
          setInboxItems(buildInboxItems(artifacts, nextApprovals, nextOutbound));
          return artifacts;
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
    ])
      .then(([artifactList, approvalList, outboundList]) => {
        setArtifacts(artifactList);
        setApprovals(approvalList);
        setOutboundActions(outboundList);
        setInboxItems(buildInboxItems(artifactList, approvalList, outboundList));
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load channel data");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return {
    artifacts,
    approvals,
    outboundActions,
    inboxItems,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
    applyDecideResult,
  };
}
