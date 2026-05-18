import Link from "next/link";
import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardRow, CardTitle } from "@/components/Card";
import { StatusChip } from "@/components/StatusChip";
import { artifacts } from "@/lib/fixtures";

export default function ReportsArtifactsPage() {
  return (
    <>
      <Header
        title="Reports & Artifacts"
        nextFocus="Generated work product, drafts, and reports"
        action={
          <Link
            href="/meetings/reports-artifacts"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            Open meeting
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <Zone title="Pending review">
            {artifacts
              .filter((a) => a.status !== "Completed")
              .map((a) => (
                <Card key={a.id}>
                  <CardRow>
                    <div className="space-y-1">
                      <CardTitle>{a.title}</CardTitle>
                      <CardMeta>
                        {a.type} · {a.agent} · {a.updated}
                      </CardMeta>
                    </div>
                    <StatusChip status={a.status} />
                  </CardRow>
                </Card>
              ))}
          </Zone>
          <Zone title="Recent">
            {artifacts.map((a) => (
              <Card key={a.id}>
                <CardRow>
                  <div className="space-y-1">
                    <CardTitle>{a.title}</CardTitle>
                    <CardMeta>
                      {a.type} · {a.updated}
                    </CardMeta>
                  </div>
                  <StatusChip status={a.status} />
                </CardRow>
              </Card>
            ))}
          </Zone>
        </div>
      </div>
    </>
  );
}
