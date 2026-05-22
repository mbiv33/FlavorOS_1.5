"use client";

import Link from "next/link";
import { useState } from "react";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { Card } from "@/components/Card";
import { StatusChip } from "@/components/StatusChip";
import { formatOutboundExecutionSnippet, mapOutboundStatusToChip } from "@/lib/mappers";
import {
  createApproval,
  createArtifact,
  executeOutboundAction,
  loadSession,
  pullBackOutboundAction,
} from "@/lib/api";
import { useCommunicationsData } from "@/lib/hooks/useCommunicationsData";

export default function CommunicationsPage() {
  const {
    piles,
    stats,
    contactGroups,
    outboundActions,
    loading,
    error,
    refresh,
    handleAfterDecide,
  } = useCommunicationsData();
  const [pullingId, setPullingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [composerTo, setComposerTo] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);

  async function handleExecuteRetry(outboundId: string) {
    const session = loadSession();
    if (!session) return;
    setExecutingId(outboundId);
    try {
      await executeOutboundAction(session, outboundId);
      refresh();
    } finally {
      setExecutingId(null);
    }
  }

  async function handlePrepareDraft() {
    const session = loadSession();
    if (!session) return;
    const to = composerTo.trim();
    const subject = composerSubject.trim();
    const body = composerBody.trim();
    if (!to || !subject || !body) {
      setComposerMessage("To, subject, and body are required.");
      return;
    }
    setComposerBusy(true);
    setComposerMessage(null);
    try {
      const artifact = await createArtifact(session, {
        kind: "client",
        title: subject,
        body,
        status: "ready",
        meta: {
          artifact_type: "draft_email",
          channel: "email",
          to,
          subject,
        },
      });
      await createApproval(session, {
        artifact_id: artifact.id,
        governed_action: "send_communication_draft",
        reason: "Client email draft prepared from Communications composer.",
      });
      setComposerTo("");
      setComposerSubject("");
      setComposerBody("");
      setComposerMessage(
        "Draft submitted for approval. After you approve, it queues for the next 10:00, 13:00, or 16:00 send window.",
      );
      refresh();
    } catch (err) {
      setComposerMessage(err instanceof Error ? err.message : "Could not prepare draft.");
    } finally {
      setComposerBusy(false);
    }
  }

  async function handlePullBack(outboundId: string) {
    const session = loadSession();
    if (!session) return;
    setPullingId(outboundId);
    try {
      await pullBackOutboundAction(session, outboundId);
      refresh();
    } finally {
      setPullingId(null);
    }
  }

  return (
    <SurfaceFrame
      title="Communications"
      description="A calm inbox over your messages, drafts, and contacts."
      action={
        <Link
          href="/meetings/communications"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading communications…</p>
      ) : (
        <>
          <SurfaceSection title="Stats">
            <StatStrip stats={stats} />
          </SurfaceSection>

          <SurfaceSection title="Inbox · Outbox">
            {piles.every((p) => p.items.length === 0) ? (
              <p className="text-sm text-muted">
                No inbox items yet — your communications pile will populate after the first
                provider sync.
              </p>
            ) : (
              <PileRow piles={piles} onAfterDecide={handleAfterDecide} />
            )}
          </SurfaceSection>

          {outboundActions.length > 0 ? (
            <SurfaceSection title="Outbound queue">
              <Card>
                <ul className="divide-y divide-border">
                  {outboundActions.slice(0, 8).map((o) => {
                    const executionSnippet = formatOutboundExecutionSnippet(o);
                    const canPullBack = o.status === "queued";
                    const canRetry = o.status === "failed";
                    return (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{o.action_type}</p>
                          <p className="text-xs text-muted">{o.provider}</p>
                          {executionSnippet ? (
                            <p className="mt-1 text-xs text-muted-strong">
                              {executionSnippet}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {canPullBack ? (
                            <button
                              type="button"
                              disabled={pullingId === o.id}
                              onClick={() => handlePullBack(o.id)}
                              className="rounded-md border border-border-strong px-2 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-40"
                            >
                              {pullingId === o.id ? "Pulling…" : "Pull back"}
                            </button>
                          ) : null}
                          {canRetry ? (
                            <button
                              type="button"
                              disabled={executingId === o.id}
                              onClick={() => handleExecuteRetry(o.id)}
                              className="rounded-md border border-border-strong px-2 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-40"
                            >
                              {executingId === o.id ? "Retrying…" : "Retry"}
                            </button>
                          ) : null}
                          <StatusChip status={mapOutboundStatusToChip(o.status)} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </SurfaceSection>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <SurfaceSection title="Contacts">
              <Card>
                {contactGroups.length === 0 ? (
                  <p className="text-sm text-muted">No contacts from sync yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {contactGroups.map((group) => (
                      <li key={group.context}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-strong">
                          {group.context}
                        </p>
                        <ul className="space-y-2">
                          {group.contacts.map((c) => (
                            <li
                              key={c.id}
                              className="rounded-md border border-border px-3 py-2 hover:bg-surface-muted"
                            >
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-xs text-muted">{c.meta}</p>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </SurfaceSection>

            <SurfaceSection title="Composer">
              <Card>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>To:</span>
                    <input
                      type="text"
                      placeholder="Pick a contact"
                      value={composerTo}
                      onChange={(e) => setComposerTo(e.target.value)}
                      className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Subject:</span>
                    <input
                      type="text"
                      placeholder="What's this about?"
                      value={composerSubject}
                      onChange={(e) => setComposerSubject(e.target.value)}
                      className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                    />
                  </div>
                  <textarea
                    placeholder="Write a draft. Sinclair will prepare it for your approval — nothing sends without you."
                    value={composerBody}
                    onChange={(e) => setComposerBody(e.target.value)}
                    className="h-40 w-full resize-none rounded-md border border-border-strong bg-surface-muted p-3 text-sm outline-none focus:border-ring"
                  />
                  {composerMessage ? (
                    <p className="text-xs text-muted-strong">{composerMessage}</p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">
                      Approve queues for the next 10:00, 13:00, or 16:00 send window (your
                      timezone).
                    </p>
                    <button
                      type="button"
                      disabled={composerBusy}
                      onClick={handlePrepareDraft}
                      className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {composerBusy ? "Preparing…" : "Prepare draft"}
                    </button>
                  </div>
                </div>
              </Card>
            </SurfaceSection>
          </div>
        </>
      )}
    </SurfaceFrame>
  );
}
