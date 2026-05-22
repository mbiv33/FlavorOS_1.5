"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CLIENT_NAV: Array<{ href: string; label: string }> = [
  { href: "/command-center", label: "Home" },
  { href: "/briefings", label: "Briefings" },
  { href: "/communications", label: "Comms" },
  { href: "/calendar", label: "Calendar" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

const ADMIN_NAV: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Console" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/workflows", label: "Workflows" },
  { href: "/admin/artifacts", label: "Artifacts" },
  { href: "/admin/logs", label: "Logs" },
];

export function MobileNav({
  variant,
}: {
  variant: "client" | "admin";
}) {
  const pathname = usePathname() ?? "";
  const items = variant === "client" ? CLIENT_NAV : ADMIN_NAV;

  return (
    <header className="border-b border-border bg-surface lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          FlavorOS
        </Link>
        {variant === "client" ? (
          <Link
            href="/meetings"
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
          >
            Meeting
          </Link>
        ) : (
          <span className="text-xs text-muted">Operator</span>
        )}
      </div>
      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Primary"
      >
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-surface-muted font-medium text-foreground"
                  : "text-muted-strong hover:bg-surface-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-2 text-xs text-muted">
        {variant === "client" ? (
          <Link href="/admin" className="hover:text-foreground">
            Operator console →
          </Link>
        ) : (
          <Link href="/command-center" className="hover:text-foreground">
            Client app →
          </Link>
        )}
      </div>
    </header>
  );
}
