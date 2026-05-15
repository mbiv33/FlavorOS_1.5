"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Overview" },
  { href: "/tenants", label: "Tenant monitor" },
  { href: "/agents", label: "Agent monitor" },
  { href: "/workflows", label: "Workflow monitor" },
  { href: "/providers", label: "Provider sync" },
  { href: "/gbrain", label: "GBrain status" },
  { href: "/artifacts", label: "Artifact queue" },
  { href: "/approvals", label: "Approval queue" },
  { href: "/logs", label: "Logs" },
  { href: "/config", label: "Config editor" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)] text-[var(--foreground)]">
      <aside className="border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 md:w-56 shrink-0 p-4 flex flex-col gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            FlavorOS
          </div>
          <div className="text-lg font-semibold">Admin</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Diagnostics & monitors (MVP shell)
          </div>
        </div>
        <nav className="flex flex-wrap md:flex-col gap-1">
          {NAV.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-neutral-200 dark:bg-neutral-800 font-medium"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10 space-y-8">{children}</main>
    </div>
  );
}
