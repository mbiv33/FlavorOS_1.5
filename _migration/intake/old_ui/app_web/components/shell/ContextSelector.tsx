"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { AppContext } from "@/lib/types/context";
import { cn } from "@/lib/cn";

interface ContextSelectorProps {
  contexts: AppContext[];
}

const ALL_VALUE = "__all__";

/**
 * Header context selector. Hidden entirely when the user has only one context
 * (PRD 02 §Context model · principle 3). Default selection is "All".
 */
export function ContextSelector({ contexts }: ContextSelectorProps) {
  const [selected, setSelected] = useState<string>(ALL_VALUE);

  if (contexts.length <= 1) {
    return null;
  }

  const selectedLabel =
    selected === ALL_VALUE
      ? "All contexts"
      : contexts.find((c) => c.id === selected)?.label ?? "All contexts";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full",
            "bg-[rgba(91,70,214,0.08)] text-accent",
            "border border-[rgba(91,70,214,0.14)]",
            "text-[12.5px] font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          )}
        >
          {selectedLabel}
          <span aria-hidden className="text-[9px] opacity-70">
            ▾
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="min-w-[180px] rounded-card border border-line bg-card-solid shadow-md2 p-1 z-50"
        >
          <ContextItem
            label="All contexts"
            selected={selected === ALL_VALUE}
            onSelect={() => setSelected(ALL_VALUE)}
          />
          <DropdownMenu.Separator className="h-px bg-line my-1" />
          {contexts.map((c) => (
            <ContextItem
              key={c.id}
              label={c.label}
              selected={selected === c.id}
              onSelect={() => setSelected(c.id)}
            />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ContextItem({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "px-2.5 py-1.5 rounded-md cursor-pointer outline-none",
        "text-[13px] text-ink-2 font-medium",
        "data-[highlighted]:bg-[rgba(91,70,214,0.07)]",
        "data-[highlighted]:text-accent",
        selected && "text-accent font-semibold",
      )}
    >
      {label}
    </DropdownMenu.Item>
  );
}
