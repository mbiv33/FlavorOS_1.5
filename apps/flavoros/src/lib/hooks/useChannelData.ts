"use client";

import { useEffect, useState } from "react";

import { listArtifacts, listApprovals, loadSession, type ArtifactRead, type ApprovalRead } from "@/lib/api";
import { approvalToInboxItem, artifactToInboxItem } from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

export type ChannelData = {
  artifacts: ArtifactRead[];
  approvals: ApprovalRead[];
  inboxItems: InboxItem[];
  loading: boolean;
  error: string | null;
};

export function useChannelData(): ChannelData {
  const [artifacts, setArtifacts] = useState<ArtifactRead[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRead[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setLoading(false);
      return;
    }

    Promise.all([
      listArtifacts(session),
      listApprovals(session, "pending"),
    ])
      .then(([artifactList, approvalList]) => {
        setArtifacts(artifactList);
        setApprovals(approvalList);
        const items: InboxItem[] = [
          ...approvalList.map(approvalToInboxItem),
          ...artifactList.map(artifactToInboxItem),
        ];
        setInboxItems(items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load channel data");
      })
      .finally(() => setLoading(false));
  }, []);

  return { artifacts, approvals, inboxItems, loading, error };
}
