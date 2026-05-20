"use client";

import { useEffect, useState } from "react";

import {
  getProfile,
  getUniverseEnvelope,
  listArtifacts,
  listApprovals,
  loadSession,
  type ClientUniverseEnvelope,
  type ProfileRead,
} from "@/lib/api";
import { approvalToInboxItem, artifactToInboxItem } from "@/lib/mappers";
import type { InboxItem } from "@/lib/fixtures";

type CommandCenterData = {
  profile: ProfileRead | null;
  universe: ClientUniverseEnvelope | null;
  inboxItems: InboxItem[];
  loading: boolean;
  error: string | null;
};

export function useCommandCenterData(): CommandCenterData {
  const [profile, setProfile] = useState<ProfileRead | null>(null);
  const [universe, setUniverse] = useState<ClientUniverseEnvelope | null>(null);
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
      getUniverseEnvelope(session).catch(() => null),
      listArtifacts(session),
      listApprovals(session, "pending"),
    ])
      .then(([prof, env, artifacts, approvals]) => {
        setProfile(prof);
        setUniverse(env);
        const artifactMap = new Map(artifacts.map((a) => [a.id, a]));
        const items: InboxItem[] = [
          ...approvals.map((a) => approvalToInboxItem(a, artifactMap)),
          ...artifacts.map((a) => artifactToInboxItem(a)),
        ];
        setInboxItems(items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  return { profile, universe, inboxItems, loading, error };
}
