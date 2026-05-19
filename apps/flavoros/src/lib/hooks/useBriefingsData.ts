"use client";

import { useEffect, useState } from "react";

import { listArtifacts, listApprovals, loadSession } from "@/lib/api";
import type { BriefingSummary } from "@/lib/mappers";
import { buildBriefingSummaries, briefingAttentionItems } from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

type BriefingsData = {
  briefings: BriefingSummary[];
  attentionItems: InboxItem[];
  loading: boolean;
  error: string | null;
};

export function useBriefingsData(): BriefingsData {
  const [briefings, setBriefings] = useState<BriefingSummary[]>([]);
  const [attentionItems, setAttentionItems] = useState<InboxItem[]>([]);
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
      .then(([artifacts, approvals]) => {
        setBriefings(buildBriefingSummaries(artifacts, approvals));
        setAttentionItems(briefingAttentionItems(artifacts, approvals));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load briefings");
      })
      .finally(() => setLoading(false));
  }, []);

  return { briefings, attentionItems, loading, error };
}
