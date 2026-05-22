import type { ReactNode } from "react";
import { LeftNav } from "./LeftNav";
import { MobileNav } from "./MobileNav";

export function AppShell({
  variant,
  children,
}: {
  variant: "client" | "admin";
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <LeftNav variant={variant} className="hidden lg:flex" />
      <MobileNav variant={variant} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
