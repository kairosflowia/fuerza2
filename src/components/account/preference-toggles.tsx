"use client";

import { useRef, useState, useTransition } from "react";

type Toggle = { name: string; label: string; description: string; defaultChecked: boolean };

/**
 * Interruptores que se guardan al cambiar, con la misma acción de servidor
 * de antes (el formulario envía siempre el estado completo del grupo).
 */
export function PreferenceToggles({ action, items, legend }: { action: (formData: FormData) => Promise<void>; items: Toggle[]; legend: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => {
    const form = formRef.current;
    if (!form) return;
    setSaved(false);
    startTransition(async () => {
      await action(new FormData(form));
      setSaved(true);
    });
  };

  return (
    <form ref={formRef} className="fz-toggles" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <fieldset>
        <legend className="sr-only">{legend}</legend>
        {items.map((item) => (
          <label key={item.name} className="fz-toggle">
            <input type="checkbox" role="switch" name={item.name} defaultChecked={item.defaultChecked} onChange={save} />
            <span className="fz-toggle__track" aria-hidden="true" />
            <span className="fz-toggle__text">
              {item.label}
              <small>{item.description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="fz-toggles__status" aria-live="polite">{pending ? "Guardando…" : saved ? "Cambios guardados" : ""}</p>
    </form>
  );
}
