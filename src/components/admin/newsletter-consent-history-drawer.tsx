"use client";

import { useRef, useState } from "react";

import { Drawer } from "@/components/ui";

type ConsentRow = {
  event_type: string;
  consent_version: string | null;
  source: string | null;
  actor_name: string;
  created_at: string;
};

const EVENT_LABELS: Record<string, string> = {
  subscribed: "Alta",
  resent_confirmation: "Reenvío de confirmación",
  confirmed: "Confirmación (double opt-in)",
  unsubscribed: "Baja",
  blocked: "Bloqueado",
  reactivated: "Reactivado",
  resubscribed: "Nueva alta tras baja",
};

export function NewsletterConsentHistoryDrawer({ subscriberId, email }: { subscriberId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ConsentRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const response = await fetch(`/api/admin/clientes/suscritos/historial?subscriberId=${subscriberId}`);
    const data = await response.json();
    setRows(response.ok ? data.rows : []);
    setLoading(false);
  }

  return (
    <>
      <button ref={triggerRef} type="button" className="button button--secondary" onClick={handleOpen}>Ver historial</button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Historial de consentimiento · ${email}`} returnFocusRef={triggerRef}>
        {loading ? <p className="field__help">Cargando…</p> : null}
        {!loading && rows?.length === 0 ? <p className="field__help">Todavía no hay historial para este suscrito.</p> : null}
        {rows?.length ? (
          <ul className="inventory-list">
            {rows.map((row, index) => (
              <li key={index} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{EVENT_LABELS[row.event_type] ?? row.event_type}</p>
                  <p className="inventory-row__variant">
                    {new Date(row.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    {row.source ? ` · ${row.source}` : ""}
                    {row.consent_version ? ` · Consentimiento ${row.consent_version}` : ""}
                    {" · "}{row.actor_name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Drawer>
    </>
  );
}
