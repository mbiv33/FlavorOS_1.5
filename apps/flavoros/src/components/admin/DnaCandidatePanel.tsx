"use client";

import { useEffect, useState } from "react";

import { Card, CardMeta, CardTitle } from "@/components/Card";
import {
  acceptDnaCandidate,
  getAdminSession,
  listDnaCandidates,
  rejectDnaCandidate,
  type ClientDnaCandidateRead,
} from "@/lib/admin-api";
import Link from "next/link";

const DNA_DOMAINS = ["contacts", "locations", "entities", "projects"] as const;
type DnaDomain = (typeof DNA_DOMAINS)[number];

const DOMAIN_FILTERS: { label: string; value: DnaDomain | null }[] = [
  { label: "All", value: null },
  { label: "Contacts", value: "contacts" },
  { label: "Locations", value: "locations" },
  { label: "Entities", value: "entities" },
  { label: "Projects", value: "projects" },
];

function confidenceBar(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function DnaCandidatePanel() {
  const [candidates, setCandidates] = useState<ClientDnaCandidateRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [domainFilter, setDomainFilter] = useState<DnaDomain | null>(null);
  const [acting, setActing] = useState<Record<string, "accepting" | "rejecting">>({});

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      setSessionMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    listDnaCandidates(session, domainFilter ?? undefined, "pending")
      .then(setCandidates)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load DNA candidates"),
      )
      .finally(() => setLoading(false));
  }, [domainFilter]);

  async function handleAccept(id: string) {
    const session = getAdminSession();
    if (!session) return;
    setActing((prev) => ({ ...prev, [id]: "accepting" }));
    try {
      const updated = await acceptDnaCandidate(session, id);
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).filter((c) => c.status === "pending"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setActing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  async function handleReject(id: string) {
    const session = getAdminSession();
    if (!session) return;
    setActing((prev) => ({ ...prev, [id]: "rejecting" }));
    try {
      const updated = await rejectDnaCandidate(session, id);
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).filter((c) => c.status === "pending"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {sessionMissing && (
        <Card>
          <CardTitle>Sign in required</CardTitle>
          <CardMeta>
            <Link href="/login" className="underline">
              Go to login
            </Link>{" "}
            to load DNA candidates.
          </CardMeta>
        </Card>
      )}

      {error && (
        <Card>
          <CardTitle>Error</CardTitle>
          <CardMeta>{error}</CardMeta>
        </Card>
      )}

      {!sessionMissing && (
        <div className="flex flex-wrap gap-2">
          {DOMAIN_FILTERS.map((f) => {
            const active = domainFilter === f.value;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setDomainFilter(f.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border-strong hover:bg-surface-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {loading && !sessionMissing && (
        <Card>
          <CardMeta>Loading candidates…</CardMeta>
        </Card>
      )}

      {!loading && !error && !sessionMissing && candidates.length === 0 && (
        <Card>
          <CardMeta>No pending DNA candidates.</CardMeta>
        </Card>
      )}

      {!loading && !sessionMissing && candidates.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-2 font-medium text-muted">ID</th>
                  <th className="px-4 py-2 font-medium text-muted">Domain</th>
                  <th className="px-4 py-2 font-medium text-muted">Content</th>
                  <th className="px-4 py-2 font-medium text-muted">Conf</th>
                  <th className="px-4 py-2 font-medium text-muted">Attempts</th>
                  <th className="px-4 py-2 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const busy = acting[c.id];
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-xs text-muted">
                        {truncateId(c.id)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs">
                          {c.domain}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-2">
                        <span className="line-clamp-2 text-sm">{c.content}</span>
                      </td>
                      <td className="px-4 py-2 text-muted text-xs">
                        {confidenceBar(c.confidence)}
                      </td>
                      <td className="px-4 py-2 text-center text-muted text-xs">
                        {c.verification_attempts}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => handleAccept(c.id)}
                            className="rounded border border-green-700 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
                          >
                            {busy === "accepting" ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => handleReject(c.id)}
                            className="rounded border border-border-strong px-2 py-0.5 text-xs font-medium text-muted hover:bg-surface-muted disabled:opacity-40"
                          >
                            {busy === "rejecting" ? "…" : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <p className="text-sm text-muted">
          Pending candidates from Lane Y (account sweep + LLM parse). Accept
          promotes to GBrain durable memory. Reject returns to queue; 3× rejection
          purges permanently.
        </p>
      </Card>
    </div>
  );
}
