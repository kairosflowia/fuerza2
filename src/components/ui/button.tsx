import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Loading } from "./loading";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "text"
  | "destructive"
  | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  loadingLabel = "Cargando…",
  className,
  disabled,
  children,
  type = "button",
  ...props
}, ref) {
  return (
    <button
      type={type}
      ref={ref}
      className={cn(
        "button",
        `button--${variant}`,
        fullWidth && "button--full",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loading size="small" label="" />
          <span aria-live="polite">{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
