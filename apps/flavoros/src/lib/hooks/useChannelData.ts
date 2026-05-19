"use client";

import { useEffect, useState } from "react";

import {
  listArtifacts,
  listApprovals,
  listOutboundActions,
  loadSession,
  type ArtifactRead,
  type ApprovalRead,
  type OutboundActionRead,
} from "@/lib/api";
import {
  approvalToInboxItem,
  artifactToInboxItem,
  enrichInboxItemsWithOutbound,
} from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

export type ChannelData = {
  artifacts: ArtifactRead[];
  approvals: ApprovalRead[];
  outboundActions: OutboundActionRead[];
  inboxItems: InboxItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

function buildInboxItems(
  artifactList: ArtifactRead[],
  approvalList: ApprovalRead[],
  outboundList: OutboundActionRead[],
): InboxItem[] {
  const outboundByApproval = new Map(
    outboundList.map((o) => [o.approval_id, o]),
  );
  const items: InboxItem[] = [
    ...approvalList.map(approvalToInboxItem),
    ...artifactList.map(artifactToInboxItem),
  ];
  return enrichInboxItemsWithOutbound(items, outboundByApproval);
}

export function useChannelData(): ChannelData {
  const [artifacts, setArtifacts] = useState<ArtifactRead[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRead[]>([]);
  const [outboundActions, setOutboundActions] = useState<OutboundActionRead[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  };
}
