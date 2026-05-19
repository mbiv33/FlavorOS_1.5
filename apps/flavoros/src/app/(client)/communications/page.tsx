"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { Card } from "@/components/Card";
import { useCommunicationsData } from "@/lib/hooks/useCommunicationsData";

export default function CommunicationsPage() {
  const { piles, stats, contactGroups, loading, error } = useCommunicationsData();

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
              <PileRow piles={piles} />
            )}
          </SurfaceSection>

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
                      className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Subject:</span>
                    <input
                      type="text"
                      placeholder="What's this about?"
                      className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                    />
                  </div>
                  <textarea
                    placeholder="Write a draft. Sinclair will prepare it for your approval — nothing sends without you."
                    className="h-40 w-full resize-none rounded-md border border-border-strong bg-surface-muted p-3 text-sm outline-none focus:border-ring"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">
                      Submitting creates a draft → approval, never a direct send.
                    </p>
                    <button className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90">
                      Prepare draft
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
