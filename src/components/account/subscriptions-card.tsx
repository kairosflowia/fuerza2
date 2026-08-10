"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, Button, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";

type Subscription = {
  id: string;
  status: string;
  frequency: string;
  next_collection_date: string | null;
  total_cents: number;
  pickupPointName: string | null;
};

const STATUS_LABELS_ES: Record<string, string> = {
  incomplete: "Incompleta",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago pendiente",
  paused: "Pausada",
  cancel_pending: "Se cancela al final del ciclo",
  cancelled: "Cancelada",
  unpaid: "Impago",
  requires_attention: "Requiere atención",
};

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  trialing: "success",
  paused: "warning",
  cancel_pending: "warning",
  past_due: "error",
  unpaid: "error",
  requires_attention: "error",
  cancelled: "neutral",
  incomplete: "neutral",
};

const CANCELLABLE_STATUSES = new Set(["active", "trialing", "paused", "past_due"]);

export function AccountSubscriptionsCard({ subscriptions }: { subscriptions: Subscription[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function cancel(id: string) {
    const confirmed = confirm(
      "¿Seguro que quieres cancelar? Si quedan 48h o más para el próximo ciclo, se cancela de inmediato; si no, se aplicará después de ese ciclo.",
    );
    if (!confirmed) return;
    setBusyId(id);
    setMessage("");
    const response = await fetch("/api/subscriptions/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
    if (!response.ok) {
      setMessage("No hemos podido cancelar ahora mismo. Inténtalo de nuevo en unos minutos.");
      return;
    }
    setMessage("Cancelación registrada.");
    setTimeout(() => location.reload(), 1200);
  }

  if (!subscriptions.length) {
    return (
      <EmptyState
        title="Todavía no tienes Fuerza Habitual"
        description="Elige tu pan y tu frecuencia para no tener que pedir cada vez."
        action={
          <Link className="button button--primary" href="/plan-de-pan/membresias">
            Ver membresías
          </Link>
        }
      />
    );
  }

  return (
    <div className="account-subscriptions">
      <ul className="account-subscriptions__list">
        {subscriptions.map((s) => (
          <li key={s.id} className="account-subscriptions__row">
            <div className="account-subscriptions__info">
              <p className="account-subscriptions__meta">
                <Badge variant={STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{STATUS_LABELS_ES[s.status] ?? s.status}</Badge>
                <span>{FREQUENCY_LABELS_ES[s.frequency as SubscriptionFrequency] ?? s.frequency}</span>
                {s.pickupPointName ? <span> · {s.pickupPointName}</span> : null}
              </p>
              <p className="account-subscriptions__detail">
                Próxima recogida: {s.next_collection_date ?? "pendiente"} · {formatPrice(s.total_cents)} por ciclo
              </p>
            </div>
            <div className="account-subscriptions__actions">
              <Link href={`/cuenta/plan-de-pan/${s.id}`} className="button button--secondary">
                Ver detalles
              </Link>
              {CANCELLABLE_STATUSES.has(s.status) ? (
                <Button variant="destructive" loading={busyId === s.id} onClick={() => cancel(s.id)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {message ? (
        <p className="account-subscriptions__message" role="status">
          {message}
        </p>
      ) : null}
      <Link className="button button--secondary" href="/plan-de-pan/membresias">
        Añadir otra membresía
      </Link>
    </div>
  );
}
