import Link from "next/link";
import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";

const TILES = [
  { href: "/admin/tenants", title: "Tenants", meta: "1 tenant · 1 client" },
  {
    href: "/admin/providers",
    title: "Providers",
    meta: "Google Workspace: connected",
  },
  { href: "/admin/workflows", title: "Workflows", meta: "0 failed · 3 active" },
  { href: "/admin/agents", title: "Agents", meta: "Khadijah · Sinclair · Regine" },
  { href: "/admin/gbrain", title: "GBrain", meta: "Ingestion idle" },
  { href: "/admin/artifacts", title: "Artifact queue", meta: "2 pending review" },
  { href: "/admin/approvals", title: "Approval queue", meta: "3 needs approval" },
  { href: "/admin/logs", title: "Logs", meta: "Audit-safe runtime events" },
  { href: "/admin/config", title: "Config", meta: "Workflow + briefing flags" },
];

export default function AdminHome() {
  return (
    <>
      <Header
        title="Operator Console"
        nextFocus="Diagnostic surface for tenants, providers, workflows, and agents"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <Zone title="At a glance">
            <div className="grid gap-3 sm:grid-cols-3">
              {TILES.map((tile) => (
                <Link key={tile.href} href={tile.href} className="group">
                  <Card className="transition group-hover:border-border-strong">
                    <CardTitle>{tile.title}</CardTitle>
                    <CardMeta>{tile.meta}</CardMeta>
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
