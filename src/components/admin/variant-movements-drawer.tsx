"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Badge, Button, Drawer } from "@/components/ui";

type MovementRow = {
  occurred_at: string;
  type: string;
  category: "stock" | "reservation";
  quantity: number;
  stock_before: number | null;
  stock_after: number | null;
  order_id: string | null;
  notes: string | null;
  actor_name: string;
};

const TYPE_LABELS: Record<string, string> = {
  entrada: "Entrada",
  produccion: "Producción",
  venta: "Venta",
  merma: "Merma",
  ajuste: "Ajuste",
  devolucion: "Cancelación",
  reserva: "Reserva",
  liberacion: "Liberación",
};

const TYPE_VARIANT: Record<string, "success" | "information" | "error" | "warning" | "primary" | "neutral"> = {
  entrada: "success",
  produccion: "success",
  venta: "information",
  merma: "error",
  ajuste: "warning",
  devolucion: "primary",
  reserva: "warning",
  liberacion: "neutral",
};

export function VariantMovementsDrawer({ variantId, variantName }: { variantId: string; variantName: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MovementRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const response = await fetch(`/api/admin/inventario/movimientos?variantId=${variantId}`);
    const data = await response.json();
    setRows(response.ok ? data.rows : []);
    setLoading(false);
  }

  return (
    <>
      <Button ref={triggerRef} type="button" variant="secondary" onClick={handleOpen}>Ver movimientos</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Movimientos · ${variantName}`} returnFocusRef={triggerRef}>
        {loading ? <p className="field__help">Cargando…</p> : null}
        {!loading && rows?.length === 0 ? <p className="field__help">Todavía no hay movimientos para esta variante.</p> : null}
        {rows?.length ? (
          <ul className="inventory-list">
            {rows.map((row, index) => (
              <li key={index} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">
                    {new Date(row.occurred_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <p className="inventory-row__variant">
                    {row.actor_name}
                    {row.stock_before !== null ? ` · ${row.stock_before} → ${row.stock_after}` : ""}
                  </p>
                  {row.notes ? <p className="inventory-row__notes">&ldquo;{row.notes}&rdquo;</p> : null}
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={TYPE_VARIANT[row.type] ?? "neutral"}>{TYPE_LABELS[row.type] ?? row.type}</Badge>
                  <span className={row.quantity < 0 ? "admin-movement-qty admin-movement-qty--negative" : "admin-movement-qty admin-movement-qty--positive"}>
                    {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                  </span>
                </div>
                {row.order_id ? (
                  <div className="inventory-row__actions">
                    <Link href={`/admin/pedidos/${row.order_id}`} className="button button--secondary" onClick={() => setOpen(false)}>
                      Ver pedido
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </Drawer>
    </>
  );
}
