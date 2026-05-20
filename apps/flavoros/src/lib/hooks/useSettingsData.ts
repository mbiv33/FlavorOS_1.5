"use client";

import { useEffect, useState } from "react";

import {
  getProfile,
  getUniverseEnvelope,
  listProviderConnections,
  loadSession,
  type ClientUniverseEnvelope,
  type ProfileRead,
  type ProviderConnection,
} from "@/lib/api";

export type SettingsData = {
  profile: ProfileRead | null;
  providers: ProviderConnection[];
  envelope: ClientUniverseEnvelope | null;
  loading: boolean;
  error: string | null;
};

export function useSettingsData(): SettingsData {
  const [profile, setProfile] = useState<ProfileRead | null>(null);
  const [providers, setProviders] = useState<ProviderConnection[]>([]);
  const [envelope, setEnvelope] = useState<ClientUniverseEnvelope | null>(null);
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
      listProviderConnections(session),
      getUniverseEnvelope(session).catch(() => null),
    ])
      .then(([prof, conns, env]) => {
        setProfile(prof);
        setProviders(conns);
        setEnvelope(env);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  return { profile, providers, envelope, loading, error };
}
