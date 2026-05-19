"use client";

import Link from "next/link";

import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ADMIN_TILES, formatTileMeta } from "@/lib/admin-surfaces";
import { useAdminOverview } from "@/lib/hooks/useAdminOverview";

export default function AdminHome() {
  const { overview, loading, error, hasSession } = useAdminOverview();

  return (
    <>
      <Header
        title="Operator Console"
        nextFocus="Diagnostic surface for tenants, providers, workflows, and agents"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          {!hasSession ? (
            <p className="mb-4 text-sm text-muted">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to load live operator counts.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <Zone title="At a glance">
            <div className="grid gap-3 sm:grid-cols-3">
              {ADMIN_TILES.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/admin/${tile.slug}`}
                  className="group"
                >
                  <Card className="transition group-hover:border-border-strong">
                    <CardTitle>{tile.title}</CardTitle>
                    <CardMeta>
                      {loading
                        ? "Loading…"
                        : formatTileMeta(tile.slug, overview)}
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
