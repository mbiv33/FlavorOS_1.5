import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-card-solid border border-line rounded-card shadow-sm2 overflow-hidden",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
