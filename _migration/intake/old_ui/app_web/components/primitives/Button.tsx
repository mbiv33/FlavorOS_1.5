import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "primary" | "ghost" | "warn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default:
    "bg-card-solid text-ink border-line-2 hover:shadow-sm2",
  primary:
    "bg-ink text-white border-ink hover:shadow-sm2",
  ghost:
    "bg-transparent text-ink-2 border-transparent hover:bg-[rgba(31,29,43,0.04)]",
  warn:
    "bg-card-solid text-warn border-line-2 hover:shadow-sm2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-lg",
        "border text-[13px] font-semibold font-sans",
        "transition-[transform,box-shadow] duration-100 active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
});
