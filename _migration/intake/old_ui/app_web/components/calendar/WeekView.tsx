"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MOCK_WEEK } from "@/lib/mock/calendar";
import { PERSONAS } from "@/lib/types/persona";
import { PairAvatar, PersonaAvatar } from "@/components/primitives/Avatar";
import { getContextById } from "@/lib/mock/profile";
import type { CalEvent } from "@/lib/types/calendar";
import { cn } from "@/lib/cn";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_START = 7; // 7 AM
const DAY_END = 21; // 9 PM
const HOUR_HEIGHT = 44; // px per hour

/**
 * Week view, Monday-start. Compact agenda-style — events render as colored
 * blocks positioned by start time and duration. Briefings and held focus
 * blocks render with their canonical treatment (PRD 04 §4.5).
 */
export function WeekView() {
  const weekStart = useMemo(getMondayOfThisWeek, []);

  // Group events by day index 0..6.
  const byDay: CalEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of MOCK_WEEK) {
    const start = new Date(ev.start);
    const dayIdx = dayIndexFromMonday(start, weekStart);
    if (dayIdx >= 0 && dayIdx < 7) byDay[dayIdx].push(ev);
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card-solid shadow-sm2">
      {/* Header: day labels */}
      <div
        className="grid border-b border-line bg-[rgba(31,29,43,0.015)]"
        style={{ gridTemplateColumns: "60px repeat(7, minmax(0,1fr))" }}
      >
        <div className="px-2 py-2.5 text-[11px] text-ink-3 font-bold uppercase tracking-[0.06em]" />
        {DAY_LABELS.map((label, i) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const isToday = isSameDay(dayDate, new Date());
          return (
            <div
              key={label}
              className={cn(
                "px-2 py-2.5 text-center text-[11.5px] font-bold tracking-[0.04em] border-l border-line",
                isToday ? "text-accent" : "text-ink-3",
              )}
            >
              {label}{" "}
              <span className={cn("ml-1 font-semibold", isToday && "text-accent")}>
                {dayDate.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Body: hour rows + day columns with absolutely positioned events */}
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: "60px repeat(7, minmax(0,1fr))",
          height: `${(DAY_END - DAY_START) * HOUR_HEIGHT}px`,
        }}
      >
        {/* hour gutter */}
        <div className="border-r border-line">
          {Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
            <div
              key={i}
              className="text-right pr-2 text-[10.5px] text-ink-3"
              style={{ height: HOUR_HEIGHT }}
            >
              {formatHour(DAY_START + i)}
            </div>
          ))}
        </div>

        {/* day columns */}
        {byDay.map((events, dayIdx) => (
          <div
            key={dayIdx}
            className="relative border-l border-line"
          >
            {/* hour grid lines */}
            {Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
              <div
                key={i}
                className="border-b border-line"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {events.map((ev) => (
              <EventBlock key={ev.id} ev={ev} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventBlock({ ev }: { ev: CalEvent }) {
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const top = (startHour - DAY_START) * HOUR_HEIGHT;
  const height = Math.max(20, (endHour - startHour) * HOUR_HEIGHT - 2);
  const ctx = ev.contextId ? getContextById(ev.contextId) : null;

  const palette = paletteFor(ev);

  const inner = (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] overflow-hidden cursor-pointer transition-shadow",
        palette.classes,
        ev.held && "border-dashed",
        "hover:shadow-sm2",
      )}
      style={{ top, height }}
    >
      <div className="font-semibold leading-tight truncate">{ev.title}</div>
      {ev.kind === "briefing" && ev.hosts && ev.hosts.length >= 2 ? (
        <div className="mt-1">
          <PairAvatar
            personas={[PERSONAS[ev.hosts[0]], PERSONAS[ev.hosts[1]]]}
            size="xs"
          />
        </div>
      ) : ev.kind === "briefing" && ev.hosts?.[0] ? (
        <PersonaAvatar persona={PERSONAS[ev.hosts[0]]} size="xs" />
      ) : ctx ? (
        <div className="text-[10px] opacity-70 truncate mt-px">{ctx.label}</div>
      ) : null}
    </div>
  );

  if (ev.projectId) {
    return (
      <Link
        href={`/work/${ev.projectId}`}
        className="no-underline text-inherit"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function paletteFor(ev: CalEvent): { classes: string } {
  if (ev.kind === "focus-block") {
    return {
      classes:
        "bg-[rgba(63,154,126,0.1)] text-max border border-[rgba(63,154,126,0.25)]",
    };
  }
  if (ev.kind === "briefing") {
    return {
      classes:
        "bg-gradient-to-br from-[rgba(228,103,78,0.1)] to-[rgba(217,162,50,0.08)] text-ink border border-[rgba(228,103,78,0.25)]",
    };
  }
  if (ev.kind === "personal") {
    return {
      classes: "bg-[rgba(82,101,194,0.08)] text-kyl border border-[rgba(130,101,194,0.25)]",
    };
  }
  if (ev.kind === "travel-day") {
    return {
      classes: "bg-[rgba(77,128,200,0.1)] text-sco border border-[rgba(77,128,200,0.25)]",
    };
  }
  // meeting fallback — color by context if known
  return {
    classes: "bg-[rgba(91,70,214,0.08)] text-accent border border-[rgba(91,70,214,0.2)]",
  };
}

function getMondayOfThisWeek(): Date {
  const today = new Date();
  const dow = today.getDay(); // 0 Sun..6 Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  const m = new Date(today);
  m.setDate(today.getDate() + offset);
  m.setHours(0, 0, 0, 0);
  return m;
}

function dayIndexFromMonday(d: Date, monday: Date): number {
  const diff = Math.floor(
    (d.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000),
  );
  return diff;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}
