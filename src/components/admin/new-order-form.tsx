"use client";
import { useActionState, useMemo, useState } from "react";

import { createStaffOrderAction, searchStaffOrderCustomers, type StaffCustomerMatch, type StaffOrderState } from "@/app/admin/pedidos/actions";
import { Alert, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";

const initial: StaffOrderState = { ok: false };

type VariantOption = { id: string; label: string; priceCents: number };
type PickupPoint = { id: string; name: string };
type Row = { variantId: string; quantity: number };

const STEPS = ["Cliente", "Productos", "Recogida", "Pago", "Resumen"] as const;

export function NewOrderForm({ variants, pickupPoints, canSearchCustomers, prefill }: {
  variants: VariantOption[]; pickupPoints: PickupPoint[]; canSearchCustomers: boolean; prefill?: { name: string; phone: string; email: string };
}) {
  const [state, action, pending] = useActionState(createStaffOrderAction, initial);
  const [step, setStep] = useState(prefill?.name && prefill?.phone ? 1 : 0);

  const [customerName, setCustomerName] = useState(prefill?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(prefill?.phone ?? "");
  const [customerEmail, setCustomerEmail] = useState(prefill?.email ?? "");
  const [channel, setChannel] = useState("phone");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [pickupPointId, setPickupPointId] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [productQuery, setProductQuery] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<StaffCustomerMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleCustomerSearch() {
    setSearching(true);
    try {
      setCustomerResults(await searchStaffOrderCustomers(customerQuery));
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function pickCustomer(c: StaffCustomerMatch) {
    setCustomerName(c.full_name ?? "");
    setCustomerPhone(c.phone ?? "");
    setCustomerEmail(c.email ?? "");
    setCustomerResults([]);
    setCustomerQuery("");
    setHasSearched(false);
  }

  const variantById = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);
  const filteredVariants = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    if (!needle) return variants;
    return variants.filter((v) => v.label.toLowerCase().includes(needle));
  }, [variants, productQuery]);

  function addItem(variantId: string) {
    setRows((prev) => {
      const existing = prev.find((r) => r.variantId === variantId);
      if (existing) return prev.map((r) => (r.variantId === variantId ? { ...r, quantity: r.quantity + 1 } : r));
      return [...prev, { variantId, quantity: 1 }];
    });
  }
  function updateQuantity(variantId: string, quantity: number) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, quantity: Math.max(1, quantity) } : r)));
  }
  function removeItem(variantId: string) {
    setRows((prev) => prev.filter((r) => r.variantId !== variantId));
  }

  const total = rows.reduce((sum, r) => sum + (variantById.get(r.variantId)?.priceCents ?? 0) * r.quantity, 0);
  const itemsJson = JSON.stringify(rows.map((r) => ({ variant_id: r.variantId, quantity: r.quantity })));

  const stepValid = [
    customerName.trim() !== "" && customerPhone.trim() !== "",
    rows.length > 0,
    pickupPointId !== "" && collectionDate !== "",
    true,
    true,
  ];
  const firstInvalid = stepValid.findIndex((valid) => !valid);
  const lastReachable = firstInvalid === -1 ? STEPS.length - 1 : firstInvalid;

  if (!variants.length) {
    return (
      <Alert variant="warning" title="Sin artículos disponibles">
        Todavía no hay ninguna variante publicada con precio. Publica al menos un producto en /admin/productos antes de registrar un pedido manual.
      </Alert>
    );
  }

  return (
    <Card>
      <ol className="wizard-steps">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              aria-current={step === index ? "step" : undefined}
              data-done={index < step ? "true" : undefined}
              disabled={index > lastReachable}
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          </li>
        ))}
      </ol>

      <form action={action} onKeyDown={(e) => { if (e.key === "Enter" && step < STEPS.length - 1) e.preventDefault(); }}>
        <input type="hidden" name="items" value={itemsJson} />

        <div className="wizard-panel" hidden={step !== 0}>
          <Input id="staff-order-name" name="customer_name" label="Nombre del cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input id="staff-order-phone" name="customer_phone" label="Teléfono" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          <Input id="staff-order-email" name="customer_email" label="Correo electrónico" type="email" optional value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />

          {canSearchCustomers ? (
            <fieldset className="admin-fieldset">
              <legend>Buscar cliente existente (opcional)</legend>
              <p className="field__help">Rellena los datos automáticamente. No vincula el pedido a la cuenta del cliente.</p>
              <div className="component-row">
                <Input
                  id="staff-order-customer-search"
                  label="Buscar"
                  placeholder="Nombre, correo o teléfono…"
                  value={customerQuery}
                  onChange={(e) => { setCustomerQuery(e.target.value); setHasSearched(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCustomerSearch(); } }}
                />
                <Button type="button" variant="secondary" loading={searching} onClick={handleCustomerSearch} disabled={customerQuery.trim().length < 2}>Buscar</Button>
              </div>
              {customerResults.length ? (
                <ul className="inventory-list">
                  {customerResults.map((c) => (
                    <li key={c.customer_id} className="inventory-row">
                      <div className="inventory-row__main">
                        <p className="inventory-row__product">{c.full_name || "Sin nombre"}</p>
                        <p className="inventory-row__variant">{c.email}{c.phone ? ` · ${c.phone}` : ""} · {c.orders_count} pedido{c.orders_count === 1 ? "" : "s"}</p>
                      </div>
                      <div className="inventory-row__actions">
                        <Button type="button" variant="secondary" onClick={() => pickCustomer(c)}>Usar estos datos</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : hasSearched && !searching ? (
                <p className="field__help">Sin resultados para esa búsqueda.</p>
              ) : null}
            </fieldset>
          ) : null}
        </div>

        <div className="wizard-panel" hidden={step !== 1}>
          <Input
            id="staff-order-product-search"
            label="Buscar producto"
            placeholder="Nombre del producto o variante…"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
          />
          <ul className="inventory-list">
            {filteredVariants.map((v) => (
              <li key={v.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{v.label}</p>
                  <p className="inventory-row__variant">{formatPrice(v.priceCents)}</p>
                </div>
                <div className="inventory-row__actions">
                  <Button type="button" variant="secondary" onClick={() => addItem(v.id)}>Añadir</Button>
                </div>
              </li>
            ))}
            {!filteredVariants.length ? <p className="field__help">Ningún producto coincide con esa búsqueda.</p> : null}
          </ul>

          {rows.length ? (
            <fieldset className="admin-fieldset">
              <legend>Artículos del pedido</legend>
              <ul className="inventory-list">
                {rows.map((row) => {
                  const variant = variantById.get(row.variantId);
                  if (!variant) return null;
                  return (
                    <li key={row.variantId} className="inventory-row">
                      <div className="inventory-row__main">
                        <p className="inventory-row__product">{variant.label}</p>
                        <p className="inventory-row__variant">{formatPrice(variant.priceCents)} / ud.</p>
                      </div>
                      <div className="inventory-row__actions">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={row.quantity}
                          onChange={(e) => updateQuantity(row.variantId, Number(e.target.value) || 1)}
                          className="inventory-threshold-form__input"
                          aria-label={`Cantidad de ${variant.label}`}
                        />
                        <span className="inventory-row__qty">{formatPrice(variant.priceCents * row.quantity)}</span>
                        <Button type="button" variant="secondary" onClick={() => removeItem(row.variantId)}>Quitar</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p><strong>Total: {formatPrice(total)}</strong></p>
            </fieldset>
          ) : (
            <p className="field__help">Añade al menos un artículo para continuar.</p>
          )}
        </div>

        <div className="wizard-panel" hidden={step !== 2}>
          <Select id="staff-order-point" name="pickup_point_id" label="Punto de recogida" value={pickupPointId} onChange={(e) => setPickupPointId(e.target.value)}>
            <option value="">Selecciona un punto</option>
            {pickupPoints.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Input id="staff-order-date" name="collection_date" label="Fecha de recogida" type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
          <Select id="staff-order-channel" name="channel" label="Canal" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Teléfono</option>
            <option value="in_person">Presencial</option>
          </Select>
        </div>

        <div className="wizard-panel" hidden={step !== 3}>
          <Select id="staff-order-payment" name="payment_status" label="Pago" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="paid">Cobrado</option>
            <option value="pending">Pendiente de cobro</option>
          </Select>
          <Textarea id="staff-order-notes" name="notes" label="Notas internas" optional value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="wizard-panel" hidden={step !== 4}>
          <div className="wizard-summary">
            <div className="wizard-summary__row">
              <span className="wizard-summary__label">Cliente</span>
              <span>{customerName} · {customerPhone}{customerEmail ? ` · ${customerEmail}` : ""}</span>
            </div>
            <div className="wizard-summary__row">
              <span className="wizard-summary__label">Artículos</span>
              <span>{rows.map((r) => { const v = variantById.get(r.variantId); return v ? `${r.quantity} × ${v.label}` : null; }).filter(Boolean).join(", ") || "—"}</span>
            </div>
            <div className="wizard-summary__row">
              <span className="wizard-summary__label">Recogida</span>
              <span>{pickupPoints.find((p) => p.id === pickupPointId)?.name ?? "—"} · {collectionDate || "—"} · {channel === "whatsapp" ? "WhatsApp" : channel === "in_person" ? "Presencial" : "Teléfono"}</span>
            </div>
            <div className="wizard-summary__row">
              <span className="wizard-summary__label">Pago</span>
              <span>{paymentStatus === "paid" ? "Cobrado" : "Pendiente de cobro"}</span>
            </div>
            <div className="wizard-summary__row">
              <span className="wizard-summary__label">Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
          <Button type="submit" loading={pending}>Registrar pedido</Button>
          {state.message ? (
            <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Pedido registrado" : "No se ha registrado"}>
              {state.message}
            </Alert>
          ) : null}
        </div>

        <div className="wizard-actions">
          <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Atrás</Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!stepValid[step]}>Siguiente</Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
