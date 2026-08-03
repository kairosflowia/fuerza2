import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "content" | "wide";
}

export function Container({
  size = "content",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div className={cn("container", `container--${size}`, className)} {...props}>
      {children}
    </div>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: "paper" | "sunken" | "inverse";
}

export function Section({
  tone = "paper",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("section", `section--${tone}`, className)} {...props}>
      {children}
    </section>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header", compact && "page-header--compact")}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
