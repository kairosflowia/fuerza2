"use client";
import { useActionState, useState } from "react";

import { createStaffOrderAction, type StaffOrderState } from "@/app/admin/pedidos/actions";
import { Alert, Button, Card, Select } from "@/components/ui";
import { Input, Textarea } from "@/components/ui/fields";
import { formatPrice } from "@/lib/catalog-domain";

const initial: StaffOrderState = { ok: false };

type VariantOption = { id: string; label: string; priceCents: number };
type PickupPoint = { id: string; name: string };
type Row = { key: number; variantId: string; quantity: number };

export function NewOrderForm({ variants, pickupPoints }: { variants: VariantOption[]; pickupPoints: PickupPoint[] }) {
  const [state, action, pending] = useActionState(createStaffOrderAction, initial);
  const [rows, setRows] = useState<Row[]>([{ key: 0, variantId: variants[0]?.id ?? "", quantity: 1 }]);
  const nextKey = rows.length ? Math.max(...rows.map((r) => r.key)) + 1 : 0;

  const total = rows.reduce((sum, row) => {
    const variant = variants.find((v) => v.id === row.variantId);
    return sum + (variant ? variant.priceCents * row.quantity : 0);
  }, 0);

  const itemsJson = JSON.stringify(
    rows.filter((r) => r.variantId && r.quantity > 0).map((r) => ({ variant_id: r.variantId, quantity: r.quantity })),
  );

  if (!variants.length) {
    return (
      <Alert variant="warning" title="Sin artículos disponibles">
        Todavía no hay ninguna variante publicada con precio. Publica al menos un producto en /admin/productos antes de registrar un pedido manual.
      </Alert>
    );
  }

  return (
    <Card>
      <form action={action} className="admin-form">
        <input type="hidden" name="items" value={itemsJson} />

        <div className="component-row">
          <Input id="staff-order-name" name="customer_name" label="Nombre del cliente" required />
          <Input id="staff-order-phone" name="customer_phone" label="Teléfono" type="tel" required />
        </div>
        <Input id="staff-order-email" name="customer_email" label="Correo electrónico" type="email" optional />

        <div className="component-row">
          <Select id="staff-order-channel" name="channel" label="Canal" defaultValue="phone">
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Teléfono</option>
            <option value="in_person">Presencial</option>
          </Select>
          <Select id="staff-order-payment" name="payment_status" label="Pago" defaultValue="paid">
            <option value="paid">Cobrado</option>
            <option value="pending">Pendiente de cobro</option>
          </Select>
        </div>

        <div className="component-row">
          <Select id="staff-order-point" name="pickup_point_id" label="Punto de recogida" required>
            <option value="">Selecciona un punto</option>
            {pickupPoints.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Input id="staff-order-date" name="collection_date" label="Fecha de recogida" type="date" required />
        </div>

        <fieldset className="admin-fieldset">
          <legend>Artículos</legend>
          {rows.map((row) => (
            <div key={row.key} className="component-row">
              <Select
                id={`staff-order-variant-${row.key}`}
                label="Producto"
                value={row.variantId}
                onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, variantId: e.target.value } : r)))}
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.label} ({formatPrice(v.priceCents)})</option>
                ))}
              </Select>
              <Input
                id={`staff-order-quantity-${row.key}`}
                label="Cantidad"
                type="number"
                min={1}
                max={99}
                value={row.quantity}
                onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, quantity: Math.max(1, Number(e.target.value) || 1) } : r)))}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={rows.length <= 1}
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setRows((prev) => [...prev, { key: nextKey, variantId: variants[0]?.id ?? "", quantity: 1 }])}>
            Añadir artículo
          </Button>
        </fieldset>

        <Textarea id="staff-order-notes" name="notes" label="Notas internas" optional />

        <p><strong>Total estimado: {formatPrice(total)}</strong></p>

        <Button type="submit" loading={pending}>Registrar pedido</Button>
        {state.message ? (
          <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Pedido registrado" : "No se ha registrado"}>
            {state.message}
          </Alert>
        ) : null}
      </form>
    </Card>
  );
}
