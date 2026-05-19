"use client";

import { useEffect, useState } from "react";

import {
  getProfile,
  listArtifacts,
  listApprovals,
  loadSession,
  type ProfileRead,
} from "@/lib/api";
import { approvalToInboxItem, artifactToInboxItem } from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

type CommandCenterData = {
  profile: ProfileRead | null;
  inboxItems: InboxItem[];
  loading: boolean;
  error: string | null;
};

export function useCommandCenterData(): CommandCenterData {
  const [profile, setProfile] = useState<ProfileRead | null>(null);
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
      getProfile(session),
      listArtifacts(session),
      listApprovals(session, "pending"),
    ])
      .then(([prof, artifacts, approvals]) => {
        setProfile(prof);
        const items: InboxItem[] = [
          ...approvals.map(approvalToInboxItem),
          ...artifacts.map(artifactToInboxItem),
        ];
        setInboxItems(items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  return { profile, inboxItems, loading, error };
}
