"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, Button } from "@/components/ui";
import { Textarea } from "@/components/ui/fields";

const CANCELLABLE_STATUSES = ["pending_payment", "payment_processing", "confirmed"];

type CancelResult = { resolution: "cancelled_unpaid" | "refund_due" | "voucher_issued"; voucherCode: string | null } | null;

export function OrderStatusClient({ code, token }: { code: string; token: string }) {
  const [data, setData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelResult, setCancelResult] = useState<CancelResult>(null);

  useEffect(() => {
    let attempts = 0;
    let timer: number;
    const load = async () => {
      const r = await fetch(`/api/orders/${code}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (r.ok) setData(await r.json());
      if (++attempts < 12 && (!data || ["pending", "processing"].includes(data.payment_status))) timer = window.setTimeout(load, 2500);
    };
    load();
    return () => clearTimeout(timer);
  }, [code, token]);

  if (!data) return <p role="status">Procesando…</p>;

  const canCancel = !cancelResult && CANCELLABLE_STATUSES.includes(data.status);

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
    <div>
      <h2>Pedido {data.public_code}</h2>
      <p>Estado: {data.requires_review ? "requiere revisión" : cancelResult ? "cancelado" : data.status}</p>
      <p>Pago: {data.payment_status}</p>
      {data.order_items?.map((i: any) => (
        <p key={`${i.product_name_snapshot}-${i.variant_name_snapshot}`}>
          {i.quantity} × {i.product_name_snapshot} · {i.variant_name_snapshot}
        </p>
      ))}
      <p>
        <strong>Total pagado:</strong> {(data.total_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
      </p>
      <p>No necesitas pagar en el punto de recogida.</p>

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
