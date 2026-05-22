"use client";

import Link from "next/link";

import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import {
  ADMIN_TILES,
  formatTileMeta,
  type AdminTileSlug,
} from "@/lib/admin-surfaces";
import type { AdminOverview } from "@/lib/admin-api";
import { useAdminOverview } from "@/lib/hooks/useAdminOverview";

function adminTileMeta(
  slug: AdminTileSlug,
  opts: {
    hasSession: boolean;
    loading: boolean;
    error: string | null;
    overview: AdminOverview | null;
  },
): string {
  if (!opts.hasSession) {
    return "Sign in for live counts";
  }
  if (opts.loading) {
    return "Loading…";
  }
  if (opts.error) {
    return "Operator access required";
  }
  return formatTileMeta(slug, opts.overview);
}

export default function AdminHome() {
  const { overview, loading, error, hasSession } = useAdminOverview();

  return (
    <>
      <Header
        title="Operator Console"
        nextFocus="Diagnostic surface for tenants, providers, workflows, and agents"
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {!hasSession ? (
            <p className="mb-4 text-sm text-muted">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              with an operator account to load live counts.
            </p>
          ) : null}
          {hasSession && error ? (
            <p className="mb-4 rounded-lg border border-status-blocked/30 bg-surface px-4 py-3 text-sm text-status-blocked">
              This console needs operator permissions. Your current session is a
              client account — counts stay hidden until you sign in as an operator.
            </p>
          ) : null}
          <Zone title="At a glance">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_TILES.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/admin/${tile.slug}`}
                  className="group"
                >
                  <Card className="transition group-hover:border-border-strong">
                    <CardTitle>{tile.title}</CardTitle>
                    <CardMeta>
                      {adminTileMeta(tile.slug, {
                        hasSession,
                        loading,
                        error,
                        overview,
                      })}
                    </CardMeta>
                  </Card>
                </Link>
              ))}
            </div>
          </Zone>
        </div>
      </div>
    </>
  );
}
