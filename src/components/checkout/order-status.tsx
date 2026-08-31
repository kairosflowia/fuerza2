"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Alert, Badge, Button } from "@/components/ui";
import { Textarea } from "@/components/ui/fields";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs } from "@/lib/order-cutoff";
import { ORDER_STATUS_BADGE_VARIANT, PAYMENT_STATUS_BADGE_VARIANT, orderStatusLabel, paymentStatusLabel } from "@/lib/order-status-domain";

const CANCELLABLE_STATUSES = ["pending_payment", "payment_processing", "confirmed"];
const POLLING_STATUSES = ["pending", "processing"];
const MAX_POLL_ATTEMPTS = 12;

type CancelResult = { resolution: "cancelled_unpaid" | "refund_due" | "voucher_issued"; voucherCode: string | null } | null;

function pickupPointName(data: any): string | null {
  const point = data.pickup_points;
  if (!point) return null;
  return Array.isArray(point) ? (point[0]?.name ?? null) : point.name;
}

export function OrderStatusClient({ code, token }: { code: string; token: string }) {
  const cart = useCart();
  const [data, setData] = useState<any>(null);
  const [gaveUpPolling, setGaveUpPolling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelResult, setCancelResult] = useState<CancelResult>(null);

  useEffect(() => {
    let attempts = 0;
    let timer: number;
    let cancelled = false;
    const load = async () => {
      const r = await fetch(`/api/orders/${code}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (cancelled) return;
      let latest: any = null;
      if (r.ok) {
        latest = await r.json();
        setData(latest);
      }
      attempts += 1;
      const stillPolling = !latest || POLLING_STATUSES.includes(latest.payment_status);
      if (stillPolling && attempts < MAX_POLL_ATTEMPTS) {
        timer = window.setTimeout(load, 2500);
      } else if (stillPolling) {
        setGaveUpPolling(true);
      }
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code, token]);

  // La cesta solo se limpia cuando el pago está confirmado de verdad: así un
  // pago fallido o todavía pendiente nunca hace perder lo que el cliente
  // había elegido (Fase 4 del Plano Mestre UX/UI).
  const paid = data?.payment_status === "paid";
  const cleared = useRef(false);
  useEffect(() => {
    if (paid && !cleared.current) {
      cleared.current = true;
      cart.clear();
    }
  }, [paid, cart]);

  if (!data) {
    return (
      <div className="order-status">
        <h1>Estamos confirmando tu pago…</h1>
        <p role="status">No cierres esta página. Puede tardar unos segundos.</p>
      </div>
    );
  }

  const canCancel = !cancelResult && CANCELLABLE_STATUSES.includes(data.status);
  const point = pickupPointName(data);
  const stillProcessing = POLLING_STATUSES.includes(data.payment_status);
  const failed = data.payment_status === "failed" || data.status === "cancelled";
  const confirmed = data.payment_status === "paid" && !failed;

  async function submitCancel() {
    setCancelling(true);
    setCancelError("");
    const r = await fetch(`/api/orders/${code}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, reason: reason.trim() || undefined }),
    });
    const body = await r.json();
    setCancelling(false);
    if (!r.ok) {
      setCancelError("No hemos podido cancelar el pedido ahora mismo. Escríbenos si el problema continúa.");
      return;
    }
    setCancelResult({ resolution: body.resolution, voucherCode: body.voucherCode });
    setConfirming(false);
  }

  return (
    <div className="order-status">
      <div className="order-status__header">
        <h1>
          {confirmed ? "¡Pedido confirmado!" : failed ? "No se ha podido completar el pago" : "Estamos confirmando tu pago…"}
        </h1>
        <div className="admin-action-group">
          <Badge variant={ORDER_STATUS_BADGE_VARIANT[data.status] ?? "neutral"}>{orderStatusLabel(data.status)}</Badge>
          <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[data.payment_status] ?? "neutral"}>{paymentStatusLabel(data.payment_status)}</Badge>
        </div>
      </div>

      {failed ? (
        <Alert variant="error" title="El pago no se ha completado">
          Tu cesta sigue intacta: vuelve cuando quieras e inténtalo de nuevo.{" "}
          <Link href="/carrito">Volver a la cesta</Link>
        </Alert>
      ) : stillProcessing && gaveUpPolling ? (
        <Alert variant="warning" title="Esto está tardando más de lo normal">
          Guarda el código de tu pedido, <strong>{data.public_code}</strong>, y escríbenos si no recibes confirmación en unos minutos.
        </Alert>
      ) : null}

      {data.requires_review ? (
        <Alert variant="warning" title="Estamos revisando tu pedido">
          Hemos recibido tu pago y lo estamos revisando manualmente antes de confirmarlo del todo. Te contactaremos en breve; no hace falta que hagas nada más.
        </Alert>
      ) : null}

      <section className="order-status__section">
        <h2>Pedido {data.public_code}</h2>
        <ul className="checkout-summary__items">
          {data.order_items?.map((i: any) => (
            <li key={`${i.product_name_snapshot}-${i.variant_name_snapshot}`}>
              <span>{i.quantity} × {i.product_name_snapshot} {i.variant_name_snapshot ? `— ${i.variant_name_snapshot}` : ""}</span>
              <span>{formatPrice(i.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <p className="cart-summary-total"><span>Total pagado</span><strong>{formatPrice(data.total_cents)}</strong></p>
      </section>

      <section className="order-status__section">
        <h2>Recogida</h2>
        <p className="catalog-sidebar__pickup">{point ?? "Punto de recogida"}</p>
        {data.collection_date ? <p className="catalog-sidebar__date">{formatDateEs(data.collection_date)}</p> : null}
        <p>No necesitas pagar en el punto de recogida.</p>
      </section>

      {confirmed ? (
        <Alert variant="success" title="Próximos pasos">
          Te avisaremos si hay cualquier cambio en tu pedido. Preséntate en el punto y la fecha indicados con el código <strong>{data.public_code}</strong>.
        </Alert>
      ) : null}

      {cancelResult ? (
        <Alert variant={cancelResult.resolution === "voucher_issued" ? "warning" : "success"} title="Pedido cancelado">
          {cancelResult.resolution === "refund_due" ? "Te devolvemos el importe íntegro; puede tardar unos días en aparecer en tu cuenta." : null}
          {cancelResult.resolution === "voucher_issued" ? (
            <>
              Al cancelar con menos de 48h de antelación, hemos emitido un vale por el importe íntegro en vez de una devolución.
              {cancelResult.voucherCode ? (
                <>
                  {" "}
                  Código del vale: <strong>{cancelResult.voucherCode}</strong>.
                </>
              ) : null}
            </>
          ) : null}{" "}
          Consulta la <Link href="/politica-de-cancelacion">política de cancelación</Link> para más detalle.
        </Alert>
      ) : canCancel ? (
        confirming ? (
          <div className="admin-form">
            <p>
              Si quedan 48h o más para la recogida, te devolvemos el importe íntegro. Si quedan menos de 48h, emitimos un vale por el mismo
              importe en vez de una devolución. Consulta la <Link href="/politica-de-cancelacion">política de cancelación</Link>.
            </p>
            <Textarea id="cancel-reason" label="Motivo" optional value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            {cancelError ? <Alert variant="error" title="No se ha podido cancelar">{cancelError}</Alert> : null}
            <div className="component-row">
              <Button type="button" variant="destructive" loading={cancelling} onClick={submitCancel}>
                Confirmar cancelación
              </Button>
              <Button type="button" variant="secondary" disabled={cancelling} onClick={() => setConfirming(false)}>
                Volver
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
            Cancelar pedido
          </Button>
        )
      ) : null}
    </div>
  );
}
