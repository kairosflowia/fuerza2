import { cn } from "@/lib/cn";

interface LoadingProps {
  label?: string;
  size?: "small" | "medium";
  className?: string;
}

export function Loading({
  label = "Cargando…",
  size = "medium",
  className,
}: LoadingProps) {
  return (
    <span
      className={cn("loading", `loading--${size}`, className)}
      role={label ? "status" : undefined}
    >
      <span className="loading__mark" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
