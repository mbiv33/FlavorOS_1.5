import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipKind =
  | "neutral"
  | "context"
  | "money"
  | "time"
  | "outbound"
  | "irreversible"
  | "relationship";

const chipStyles: Record<ChipKind, string> = {
  neutral:
    "bg-[rgba(31,29,43,0.05)] text-ink-2 border-line",
  context:
    "bg-[rgba(91,70,214,0.07)] text-accent border-[rgba(91,70,214,0.16)]",
  money:
    "bg-[rgba(63,154,126,0.1)] text-max border-[rgba(63,154,126,0.18)]",
  time:
    "bg-[rgba(196,99,46,0.08)] text-warn border-[rgba(196,99,46,0.18)]",
  outbound:
    "bg-[rgba(82,101,194,0.08)] text-kyl border-[rgba(130,101,194,0.18)]",
  irreversible:
    "bg-[rgba(196,99,46,0.08)] text-warn border-[rgba(196,99,46,0.2)]",
  relationship:
    "bg-[rgba(196,99,46,0.06)] text-warn border-[rgba(196,99,46,0.2)]",
};

interface ChipProps {
  kind?: ChipKind;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Chip({ kind = "neutral", icon, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full",
        "text-[11.5px] font-semibold border",
        chipStyles[kind],
        className,
      )}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}
