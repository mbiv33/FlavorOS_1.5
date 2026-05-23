"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardMeta, CardTitle } from "@/components/Card";
import { DnaCandidatePanel } from "@/components/admin/DnaCandidatePanel";
import {
  getAdminSession,
  listApprovals,
  listArtifacts,
  listAuditEvents,
  listOutboundActions,
  listProviders,
  listWorkflows,
  type OutboundActionRead,
  type AuditEventRead,
  type WorkflowRunRead,
} from "@/lib/admin-api";
import type { ApprovalRead, ArtifactRead, ProviderConnection } from "@/lib/api";
import { getAdminSurface } from "@/lib/admin-surfaces";
import { formatOutboundExecutionSnippet } from "@/lib/mappers";

type LiveRow = {
  id: string;
  primary: string;
  status: string;
  createdAt: string;
  detail?: string;
};

function formatTimestamp(value: string): string {
  if (value === "—") return value;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

const OUTBOUND_STATUS_FILTERS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Queued", value: "queued" },
  { label: "Failed", value: "failed" },
  { label: "Executed", value: "executed" },
  { label: "Pulled back", value: "pulled_back" },
];

async function fetchLiveRows(
  surface: string,
  outboundStatus?: string | null,
): Promise<LiveRow[]> {
  const session = getAdminSession();
  if (!session) {
    throw new Error("Not signed in");
  }

  switch (surface) {
    case "providers": {
      const rows = await listProviders(session);
      return rows.map((p: ProviderConnection) => ({
        id: p.id,
        primary: p.provider,
        status: p.status,
        createdAt: "—",
        detail: p.account_alias ?? p.status_reason ?? undefined,
      }));
    }
    case "workflows": {
      const rows = await listWorkflows(session);
      return rows.map((w: WorkflowRunRead) => ({
        id: w.id,
        primary: w.workflow_type,
        status: w.status,
        createdAt: w.created_at,
        detail: w.agent ?? undefined,
      }));
    }
    case "artifacts": {
      const rows = await listArtifacts(session);
      return rows.map((a: ArtifactRead) => ({
        id: a.id,
        primary: a.title,
        status: a.status,
        createdAt: a.created_at,
        detail: a.kind,
      }));
    }
    case "approvals": {
      const rows = await listApprovals(session);
      return rows.map((a: ApprovalRead) => ({
        id: a.id,
        primary: a.governed_action,
        status: a.decision,
        createdAt: a.created_at,
        detail: a.reason ?? undefined,
      }));
    }
    case "outbound": {
      const rows = await listOutboundActions(
        session,
        outboundStatus ?? undefined,
      );
      return rows.map((o: OutboundActionRead) => {
        const executionSnippet = formatOutboundExecutionSnippet(o);
        const parts = [
          o.provider,
          o.approval_id ? `approval ${truncateId(o.approval_id)}` : null,
          o.artifact_id ? `artifact ${truncateId(o.artifact_id)}` : null,
          executionSnippet,
        ].filter(Boolean);
        return {
          id: o.id,
          primary: o.action_type,
          status: o.status,
          createdAt: o.executed_at ?? o.created_at,
          detail: parts.join(" · ") || undefined,
        };
      });
    }
    case "logs": {
      const rows = await listAuditEvents(session);
      return rows.map((e: AuditEventRead) => ({
        id: e.id,
        primary: e.action,
        status: e.resource_type ?? "event",
        createdAt: e.created_at,
        detail: e.resource_id ? truncateId(e.resource_id) : undefined,
      }));
    }
    default:
      return [];
  }
}

function LiveDataTable({
  rows,
  emptyLabel,
}: {
  rows: LiveRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardMeta>{emptyLabel}</CardMeta>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated">
            <tr>
              <th className="px-4 py-2 font-medium text-muted">ID</th>
              <th className="px-4 py-2 font-medium text-muted">Name</th>
              <th className="px-4 py-2 font-medium text-muted">Status</th>
              <th className="px-4 py-2 font-medium text-muted">Created</th>
              <th className="px-4 py-2 font-medium text-muted">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs">
                  {truncateId(row.id)}
                </td>
                <td className="px-4 py-2">{row.primary}</td>
                <td className="px-4 py-2">
                  <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted">
                  {formatTimestamp(row.createdAt)}
                </td>
                <td className="px-4 py-2 text-muted">{row.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AdminSurfacePanel({ surface }: { surface: string }) {
  const spec = getAdminSurface(surface);
  const [rows, setRows] = useState<LiveRow[]>([]);
  const [loading, setLoading] = useState(spec?.liveData ?? false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [outboundStatusFilter, setOutboundStatusFilter] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!spec?.liveData) {
      setLoading(false);
      return;
    }

    if (!getAdminSession()) {
      setSessionMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchLiveRows(
      surface,
      surface === "outbound" ? outboundStatusFilter : undefined,
    )
      .then(setRows)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, [surface, spec?.liveData, outboundStatusFilter]);

  if (!spec) return null;

  if (surface === "dna") {
    return <DnaCandidatePanel />;
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
            to load live operator data for this surface.
          </CardMeta>
        </Card>
      )}

      {error && (
        <Card>
          <CardTitle>Could not load data</CardTitle>
          <CardMeta>{error}</CardMeta>
        </Card>
      )}

      {spec.liveData && loading && (
        <Card>
          <CardMeta>Loading live data…</CardMeta>
        </Card>
      )}

      {surface === "outbound" && spec.liveData && !sessionMissing && (
        <div className="flex flex-wrap gap-2">
          {OUTBOUND_STATUS_FILTERS.map((filter) => {
            const active = outboundStatusFilter === filter.value;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setOutboundStatusFilter(filter.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border-strong hover:bg-surface-muted"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {spec.liveData && !loading && !error && !sessionMissing && (
        <LiveDataTable
          rows={rows}
          emptyLabel="No records returned from the API for this client."
        />
      )}

      {!spec.liveData && (
        <Card>
          <CardTitle>Specification</CardTitle>
          <CardMeta>
            See docs/ui/15-admin-console.md for the full spec. This screen is
            a scaffold; wiring lands as backend records appear.
          </CardMeta>
        </Card>
      )}

      {spec.notes.map((note, index) => (
        <Card key={index}>
          <p className="text-sm">{note}</p>
        </Card>
      ))}
    </div>
  );
}
