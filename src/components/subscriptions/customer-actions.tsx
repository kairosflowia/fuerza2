"use client";
import { useState } from "react";

import { Alert, Button } from "@/components/ui";

const RESOLUTION_LABELS_ES: Record<string, string> = {
  immediate: "Se ha aplicado de inmediato.",
  next_cycle: "El próximo ciclo ya está comprometido en producción (menos de 48h): seguirá su curso, y el cambio se aplica desde el siguiente.",
};

export function SubscriptionActions({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(path: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setMessage("No hemos podido completar la acción ahora mismo.");
      return;
    }
    setMessage(data.effective ? (RESOLUTION_LABELS_ES[data.effective] ?? "Hecho.") : "Hecho.");
    setTimeout(() => location.reload(), 1500);
  }

  return (
    <div>
      <div className="component-row">
        {status === "paused" ? (
          <Button onClick={() => call("/api/subscriptions/resume")} loading={busy}>Retomar</Button>
        ) : (
          <Button onClick={() => call("/api/subscriptions/pause")} loading={busy}>Pausar</Button>
        )}
        <Button variant="destructive" disabled={busy} onClick={() => { if (confirm("¿Seguro que quieres cancelar? Si quedan 48h o más para el próximo ciclo, se cancela de inmediato; si no, se aplicará después de ese ciclo.")) call("/api/subscriptions/cancel"); }}>
          Cancelar
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const r = await fetch("/api/subscriptions/portal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
            const d = await r.json();
            if (d.url) location.href = d.url;
          }}
        >
          Método de pago y facturas
        </Button>
      </div>
      {message ? <Alert variant="information" title="Actualizado">{message}</Alert> : null}
    </div>
  );
}
