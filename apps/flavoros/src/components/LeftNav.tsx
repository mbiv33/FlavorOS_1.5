"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile, loadSession, type ProfileRead } from "@/lib/api";

const CLIENT_NAV: Array<{ href: string; label: string }> = [
  { href: "/command-center", label: "Command Center" },
  { href: "/briefings", label: "Briefings" },
  { href: "/communications", label: "Communications" },
  { href: "/calendar", label: "Calendar" },
  { href: "/projects", label: "Projects" },
  { href: "/reports", label: "Reports & Artifacts" },
  { href: "/travel", label: "Travel / Logistics" },
  { href: "/settings", label: "Settings / Profile" },
];

const ADMIN_NAV: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Console Home" },
  { href: "/admin/tenants", label: "Tenant Monitor" },
  { href: "/admin/providers", label: "Provider Sync" },
  { href: "/admin/workflows", label: "Workflow Monitor" },
  { href: "/admin/agents", label: "Agent Monitor" },
  { href: "/admin/gbrain", label: "GBrain Ingestion" },
  { href: "/admin/artifacts", label: "Artifact Queue" },
  { href: "/admin/approvals", label: "Approval Queue" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/config", label: "Config Editor" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function LeftNav({ variant }: { variant: "client" | "admin" }) {
  const pathname = usePathname() ?? "";
  const items = variant === "client" ? CLIENT_NAV : ADMIN_NAV;
  const [profile, setProfile] = useState<ProfileRead | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    getProfile(session)
      .then(setProfile)
      .catch(() => {});
  }, []);

  const displayName = profile?.display_name ?? "";
  const userInitials = displayName ? initials(displayName) : "…";

  return (
    <nav className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="px-5 pb-3 pt-5">
        <Link href="/" className="block">
          <span className="text-base font-semibold tracking-tight">
            Flavor<span className="text-rose-700">OS</span>
          </span>
        </Link>
      </div>
      {variant === "client" ? (
        <>
          <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700"
              aria-hidden
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {displayName || <span className="text-muted">Loading…</span>}
              </p>
              <p className="text-xs text-muted">Client</p>
            </div>
          </div>
          <div className="mx-5 mb-4">
            <Link
              href="/meetings"
              className="block rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90"
            >
              Start a Meeting
            </Link>
          </div>
        </>
      ) : (
        <p className="px-5 pb-3 text-xs text-muted">Operator</p>
      )}
      <ul className="flex-1 space-y-0.5 px-2">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-surface-muted font-medium text-foreground"
                    : "text-muted-strong hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border px-4 py-3 text-xs text-muted">
        {variant === "client" ? (
          <Link href="/admin" className="hover:text-foreground">
            Switch to operator
          </Link>
        ) : (
          <Link href="/command-center" className="hover:text-foreground">
            Switch to client
          </Link>
        )}
      </div>
    </nav>
  );
}
