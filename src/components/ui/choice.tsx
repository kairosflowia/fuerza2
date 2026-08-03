import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ChoiceProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

function Choice({
  label,
  description,
  className,
  id,
  type,
  ...props
}: ChoiceProps & { type: "checkbox" | "radio" }) {
  if (!id) {
    throw new Error("Checkbox and Radio require an id.");
  }

  return (
    <div className={cn("choice", className)}>
      <input className="choice__input" id={id} type={type} {...props} />
      <label className="choice__label" htmlFor={id}>
        <span>{label}</span>
        {description ? (
          <span className="choice__description">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export function Checkbox(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />;
}

export function Radio(props: ChoiceProps) {
  return <Choice type="radio" {...props} />;
}
