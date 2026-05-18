import Link from "next/link";
import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardRow, CardTitle } from "@/components/Card";
import { StatusChip } from "@/components/StatusChip";
import { projects } from "@/lib/fixtures";

export default function ProjectsPage() {
  return (
    <>
      <Header
        title="Projects"
        nextFocus="Active projects, blockers, and next steps"
        action={
          <Link
            href="/meetings/projects"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            Open meeting
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <Zone title="Active projects">
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.id}>
                  <CardRow>
                    <div className="space-y-1">
                      <CardTitle>{p.title}</CardTitle>
                      <CardMeta>
                        Owner: {p.owner} · Due {p.dueAt}
                      </CardMeta>
                      <CardMeta>Next: {p.nextStep}</CardMeta>
                    </div>
                    <StatusChip status={p.status} />
                  </CardRow>
                </Card>
              ))}
            </div>
          </Zone>
        </div>
      </div>
    </>
  );
}
