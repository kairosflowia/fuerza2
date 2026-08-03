import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { StatusIcon } from "./icons";

type AlertVariant = "success" | "warning" | "error" | "information";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
}

export function Alert({
  variant = "information",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn("alert", `alert--${variant}`, className)}
      role={variant === "error" ? "alert" : "status"}
      {...props}
    >
      <StatusIcon className="alert__icon" />
      <div>
        <strong className="alert__title">{title}</strong>
        {children ? <div className="alert__content">{children}</div> : null}
      </div>
    </div>
  );
}
