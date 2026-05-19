"use client";

import { useEffect, useState } from "react";

import {
  getProfile,
  listProviderConnections,
  loadSession,
  type ProfileRead,
  type ProviderConnection,
} from "@/lib/api";

export type SettingsData = {
  profile: ProfileRead | null;
  providers: ProviderConnection[];
  loading: boolean;
  error: string | null;
};

export function useSettingsData(): SettingsData {
  const [profile, setProfile] = useState<ProfileRead | null>(null);
  const [providers, setProviders] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setLoading(false);
      return;
    }

    Promise.all([getProfile(session), listProviderConnections(session)])
      .then(([prof, conns]) => {
        setProfile(prof);
        setProviders(conns);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  return { profile, providers, loading, error };
}
