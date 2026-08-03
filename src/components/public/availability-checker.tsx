"use client";
import { useActionState } from "react";

import { checkAvailabilityAction, type AvailabilityCheckState } from "@/app/(public)/pan/actions";
import { Alert, Button, Select } from "@/components/ui";
import { Input } from "@/components/ui/fields";
import { useCart } from "@/components/cart/cart-provider";
import { useState } from "react";

const initial: AvailabilityCheckState = { checked: false };

type Variant = { id: string; name: string };
type Point = { id: string; name: string };

export function AvailabilityChecker({ variants, points }: { variants: Variant[]; points: Point[] }) {
  const [state, action, pending] = useActionState(checkAvailabilityAction, initial);
  const today = new Date().toISOString().slice(0, 10);
  const [variantId,setVariantId]=useState(variants[0]?.id??"");
  const {add}=useCart();

  return (
    <form action={action} className="admin-form" aria-label="Consultar disponibilidad">
      {variants.length > 1 ? (
        <Select id="availability-variant" name="variant_id" label="Variante" value={variantId} onChange={(event)=>setVariantId(event.target.value)}>
          {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
      ) : (
        <input type="hidden" name="variant_id" value={variants[0]?.id ?? ""} />
      )}
      <Select id="availability-point" name="pickup_point_id" label="¿Dónde lo recoges?" required>
        <option value="">Selecciona un punto</option>
        {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <Input id="availability-date" name="date" label="¿Qué día?" type="date" min={today} defaultValue={today} required />
      <Button type="submit" variant="secondary" loading={pending}>Ver disponibilidad</Button>

      {state.checked ? (
        <Alert variant={state.status === "available" ? "success" : state.status === "low_stock" ? "warning" : "information"} title={state.message ?? ""}>
          {state.status === "sold_out" && state.nextAvailableDate ? (
            <p>Vuelve a haber el {state.nextAvailableDate}.</p>
          ) : null}
          {state.status === "sold_out" && !state.nextAvailableDate ? (
            <p>De momento no encontramos una fecha disponible en los próximos meses.</p>
          ) : null}
        </Alert>
      ) : null}
      {state.checked && state.status!=="sold_out"?<Button type="button" onClick={()=>{const variant=variants.find(item=>item.id===variantId)??variants[0];add({variantId:variant.id,variantName:variant.name,productName:"Pan FUERZA",quantity:1})}}>Añadir al carrito</Button>:null}
    </form>
  );
}
