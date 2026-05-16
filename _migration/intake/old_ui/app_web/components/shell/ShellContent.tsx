"use client";

import { LeftNav } from "./LeftNav";
import { RightRail } from "./RightRail";
import { CallSurface } from "@/components/call/CallSurface";
import { useCallStore } from "@/lib/state/call";

/**
 * Body grid. When a call is active, the call surface takes over the center
 * + right rail columns and the right-rail threads are hidden (PRD 05/06).
 * Left nav stays so the client can still see where they are — but other surfaces
 * pause until the call ends.
 */
export function ShellContent({ children }: { children: React.ReactNode }) {
  const callActive = useCallStore((s) => !!s.call);

  if (callActive) {
    return (
      <div
        className="grid gap-5 mx-auto max-w-[1620px] px-7 pt-5 pb-[60px]"
        style={{ gridTemplateColumns: "260px minmax(0,1fr)" }}
      >
        <LeftNav />
        <main className="min-w-0">
          <CallSurface />
        </main>
      </div>
    );
  }

  return (
    <div
      className="grid gap-5 mx-auto max-w-[1620px] px-7 pt-5 pb-[60px]"
      style={{ gridTemplateColumns: "260px minmax(0,1fr) 380px" }}
    >
      <LeftNav />
      <main className="min-w-0">{children}</main>
      <RightRail />
    </div>
  );
}
