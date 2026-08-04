import type { ReactElement, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/cn";

import { WheatIcon } from "./icons";

interface StateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: (props: SVGProps<SVGSVGElement>) => ReactElement;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon = WheatIcon, className }: StateProps) {
  return (
    <div className={cn("state state--empty", className)}>
      <Icon className="state__icon" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, action }: StateProps) {
  return (
    <div className="state state--error" role="alert">
      <StatusIconProxy />
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  );
}

function StatusIconProxy() {
  return <span className="state__error-mark" aria-hidden="true">×</span>;
}
