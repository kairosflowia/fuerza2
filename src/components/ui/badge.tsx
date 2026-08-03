import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "information";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn("badge", `badge--${variant}`, className)} {...props}>
      {children}
    </span>
  );
}
