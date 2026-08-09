"use client";
import { useActionState } from "react";

import { saveCutoffSettingsAction, type CutoffSettingsState } from "@/app/admin/configuracion/reservas/actions";
import { Alert, Button, Input } from "@/components/ui";

const initial: CutoffSettingsState = { ok: false };

export function CutoffSettingsForm({ daysBefore, time }: { daysBefore: number; time: string }) {
  const [state, action, pending] = useActionState(saveCutoffSettingsAction, initial);

  return (
    <form action={action} className="admin-form">
      <Input
        id="cutoff-days-before"
        name="days_before"
        label="Antelación mínima (días)"
        type="number"
        min="0"
        defaultValue={daysBefore}
        helpText="Documento funcional del cliente: mínimo 2 días (48h)."
        error={state.errors?.days_before}
      />
      <Input
        id="cutoff-time"
        name="time"
        label="Hora de corte"
        type="time"
        defaultValue={time}
        helpText="Combinada con la antelación en días. Recomendado: la hora de apertura de recogida."
        error={state.errors?.time}
      />
      <Button type="submit" loading={pending}>Guardar</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}
