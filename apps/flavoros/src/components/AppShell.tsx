import type { ReactNode } from "react";
import { LeftNav } from "./LeftNav";

export function AppShell({
  variant,
  children,
}: {
  variant: "client" | "admin";
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <LeftNav variant={variant} />
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </div>
  );
}
