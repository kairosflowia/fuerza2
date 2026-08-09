"use client";
import { useActionState } from "react";

import { saveWeeklySpecialAction, type WeeklySpecialActionState } from "@/app/admin/productos/actions";
import { Alert, Button, Select } from "@/components/ui";
import { Input } from "@/components/ui/fields";

const initial: WeeklySpecialActionState = { ok: false };

type ProductOption = { id: string; label: string };
type SaturdayOption = { value: string; label: string };

export function WeeklySpecialForm({ products, saturdays }: { products: ProductOption[]; saturdays: SaturdayOption[] }) {
  const [state, action, pending] = useActionState(saveWeeklySpecialAction, initial);

  return (
    <form action={action} className="admin-form">
      <Select id="weekly-special-date" name="collection_date" label="Sábado" defaultValue={saturdays[0]?.value ?? ""} required>
        {saturdays.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>
      <Select id="weekly-special-product" name="product_id" label="Producto" required>
        <option value="">Selecciona un producto</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </Select>
      <Input id="weekly-special-headline" name="headline" label="Titular de destaque" optional helpText="Ej.: «Especial de la semana: pan de nueces y miel». Si lo dejas en blanco, se usa el nombre del producto." maxLength={140} />
      <Button type="submit" loading={pending}>Guardar especial de la semana</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}
