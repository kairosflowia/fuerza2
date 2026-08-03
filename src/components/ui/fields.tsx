import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

interface FieldContentProps {
  id: string;
  label: string;
  helpText?: string;
  error?: string;
  optional?: boolean;
}

function FieldContent({
  id,
  label,
  helpText,
  error,
  optional,
}: FieldContentProps) {
  return (
    <>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional ? <span className="field__optional"> (opcional)</span> : null}
      </label>
      {helpText ? (
        <span className="field__help" id={`${id}-help`}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id">,
    FieldContentProps {}

export function Input({
  id,
  label,
  helpText,
  error,
  optional,
  className,
  ...props
}: InputProps) {
  const describedBy = [helpText && `${id}-help`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("field", className)}>
      <FieldContent {...{ id, label, helpText, error, optional }} />
      <input
        id={id}
        className="field__control"
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </div>
  );
}

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">,
    FieldContentProps {}

export function Textarea({
  id,
  label,
  helpText,
  error,
  optional,
  className,
  ...props
}: TextareaProps) {
  const describedBy = [helpText && `${id}-help`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("field", className)}>
      <FieldContent {...{ id, label, helpText, error, optional }} />
      <textarea
        id={id}
        className="field__control field__textarea"
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </div>
  );
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">,
    FieldContentProps {}

export function Select({
  id,
  label,
  helpText,
  error,
  optional,
  className,
  children,
  ...props
}: SelectProps) {
  const describedBy = [helpText && `${id}-help`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("field", className)}>
      <FieldContent {...{ id, label, helpText, error, optional }} />
      <select
        id={id}
        className="field__control field__select"
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
