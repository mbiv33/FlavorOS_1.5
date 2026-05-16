import { cn } from "@/lib/cn";
import type { Persona } from "@/lib/types/persona";

type Size = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  xs: "w-5 h-5 text-[9.5px]",
  sm: "w-[22px] h-[22px] text-[10px]",
  md: "w-7 h-7 text-[11.5px]",
  lg: "w-[38px] h-[38px] text-[14px]",
};

const personaBg: Record<Persona["color"], string> = {
  kha: "bg-kha",
  sin: "bg-sin",
  max: "bg-max",
  kyl: "bg-kyl",
  sco: "bg-sco",
};

interface PersonaAvatarProps {
  persona: Persona;
  size?: Size;
  className?: string;
}

export function PersonaAvatar({ persona, size = "md", className }: PersonaAvatarProps) {
  return (
    <div
      role="img"
      aria-label={persona.name}
      className={cn(
        "rounded-full grid place-items-center text-white font-bold tracking-wide flex-shrink-0",
        sizeMap[size],
        personaBg[persona.color],
        className,
      )}
    >
      {persona.initials}
    </div>
  );
}

interface UserAvatarProps {
  initials: string;
  fullName?: string;
  size?: Size;
  className?: string;
}

export function UserAvatar({ initials, fullName, size = "lg", className }: UserAvatarProps) {
  return (
    <div
      role="img"
      aria-label={fullName ?? initials}
      className={cn(
        "rounded-full grid place-items-center text-white font-bold",
        "bg-gradient-to-br from-[#6b4226] to-[#3d2418]",
        "ring-2 ring-white shadow-[0_0_0_3px_rgba(31,29,43,0.06)]",
        sizeMap[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}

interface PairAvatarProps {
  personas: [Persona, Persona];
  size?: Size;
}

export function PairAvatar({ personas, size = "sm" }: PairAvatarProps) {
  return (
    <div className="flex">
      <PersonaAvatar persona={personas[0]} size={size} />
      <PersonaAvatar persona={personas[1]} size={size} className="-ml-2" />
    </div>
  );
}
