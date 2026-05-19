"use client";

import { useEffect, useState } from "react";

import {
  fetchAdminOverview,
  loadSession,
  type AdminOverview,
} from "@/lib/admin-api";

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setHasSession(false);
      setLoading(false);
      return;
    }

    setHasSession(true);
    fetchAdminOverview(session)
      .then(setOverview)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load overview");
      })
      .finally(() => setLoading(false));
  }, []);

  return { overview, loading, error, hasSession };
}
