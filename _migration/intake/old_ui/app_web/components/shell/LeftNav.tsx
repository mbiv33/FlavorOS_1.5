"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/primitives/Avatar";
import { MOCK_USER } from "@/lib/mock/profile";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Optional badge (count of pending). Hidden when 0/undefined. */
  badge?: number;
  /** True when child routes should also mark this active. */
  matchPrefix?: boolean;
}

// Order per PRD 02 §IA. Only items in the user-facing nav — no Team, no
// Notifications, no Settings (Preferences plays that role).
const NAV: NavItem[] = [
  { href: "/", label: "Today", icon: "◐" },
  { href: "/work", label: "Work", icon: "▦", matchPrefix: true },
  { href: "/messages", label: "Messages", icon: "✉" },
  { href: "/calendar", label: "Calendar", icon: "▥" },
  { href: "/library", label: "Library", icon: "❒" },
  { href: "/preferences", label: "Preferences", icon: "⚙" },
];

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function LeftNav() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "self-start sticky top-[76px]",
        "bg-card border border-line rounded-[18px] p-[18px_14px] shadow-sm2",
        "backdrop-blur-md",
      )}
    >
      <div className="flex items-center gap-[11px] px-2 pb-3.5 mb-3 border-b border-line">
        <UserAvatar initials={MOCK_USER.initials} fullName={MOCK_USER.fullName} />
        <div>
          <div className="font-semibold text-[13.5px] text-ink">
            {MOCK_USER.fullName}
          </div>
          <div className="text-[11.5px] text-ink-3">Today · {todayLabel()}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-px" aria-label="Main">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.matchPrefix
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] no-underline",
                "text-[13.5px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                active
                  ? "bg-[rgba(91,70,214,0.1)] text-accent font-semibold"
                  : "text-ink-2 hover:bg-[rgba(31,29,43,0.04)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="w-4 text-center text-[14px] opacity-70" aria-hidden>
                {item.icon}
              </span>
              {item.label}
              {item.badge ? (
                <span className="ml-auto text-[11px] font-bold bg-accent text-white rounded-full px-[7px] py-px">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-[18px] pt-3.5 border-t border-line text-[11.5px] text-ink-3 pl-2">
        FlavorOS
      </div>
    </aside>
  );
}
