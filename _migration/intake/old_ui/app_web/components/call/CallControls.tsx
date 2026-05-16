"use client";

import { Button } from "@/components/primitives/Button";
import { useCallStore } from "@/lib/state/call";

export function CallControls() {
  const call = useCallStore((s) => s.call);
  const togglePause = useCallStore((s) => s.togglePause);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const end = useCallStore((s) => s.end);
  if (!call) return null;
  return (
    <div className="flex gap-2 pt-3.5 mt-3.5 border-t border-line">
      <Button onClick={togglePause}>{call.paused ? "▶ Resume" : "⏸ Pause"}</Button>
      <Button variant="warn" onClick={end}>
        ⏹ End call
      </Button>
      <Button onClick={toggleMute} aria-label={call.muted ? "Unmute" : "Mute"}>
        {call.muted ? "🔊" : "🔇"}
      </Button>
    </div>
  );
}
