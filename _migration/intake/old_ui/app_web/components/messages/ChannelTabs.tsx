"use client";

import { useState } from "react";
import { MOCK_CHANNELS, MOCK_INBOX_ITEMS } from "@/lib/mock/messages";
import { PERSONAS } from "@/lib/types/persona";
import { Chip } from "@/components/primitives/Chip";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { getContextById } from "@/lib/mock/profile";
import type { ChannelId } from "@/lib/types/messages";
import { cn } from "@/lib/cn";

/**
 * Channel filter + drilldown into routed/handled items. The drilldown is a
 * viewer over Sinclair's work — coverage is the value, not workflow
 * (PRD 04 §4.4).
 */
export function ChannelTabs() {
  const [active, setActive] = useState<ChannelId>("all");
  const items =
    active === "all"
      ? MOCK_INBOX_ITEMS
      : MOCK_INBOX_ITEMS.filter((i) => i.channel === active);

  return (
    <div>
      <div className="flex flex-wrap gap-1 px-1 pb-3.5">
        {MOCK_CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12.5px] font-semibold border",
              active === c.id
                ? "bg-card-solid text-ink border-line-2"
                : "text-ink-3 border-transparent hover:bg-[rgba(31,29,43,0.04)]",
            )}
          >
            {c.label}
            {c.count ? ` · ${c.count} accts` : null}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-[13px] text-ink-3 px-1 py-3">
          Nothing on this channel right now.
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {items.map((it) => {
            const ctx = getContextById(it.contextId);
            const routed = it.routedTo ? PERSONAS[it.routedTo] : null;
            return (
              <li
                key={it.id}
                className="grid items-start gap-3 py-3 border-b border-line text-[13.5px] last:border-b-0"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-ink">
                    {it.sender}
                    {it.subject ? (
                      <span className="text-ink-3 font-normal">
                        {" — "}
                        {it.subject}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[13px] text-ink-2 mt-0.5">{it.summary}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ctx ? <Chip kind="context">{ctx.label}</Chip> : null}
                    <Chip kind="neutral">{it.intent.replace(/_/g, " ")}</Chip>
                    {routed ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 ml-1">
                        <PersonaAvatar persona={routed} size="xs" />
                        {routed.name} handling
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-[12px] text-ink-3 shrink-0">
                  {it.receivedLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
