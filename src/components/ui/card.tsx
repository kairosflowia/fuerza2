import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cn("card", className)} {...props}>
      {children}
    </article>
  );
}
