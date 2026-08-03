"use client";
import { useActionState, useEffect, useState } from "react";
import {
  createExceptionAction,
  saveAcceptedProductsAction,
  saveCapacityDefaultsAction,
  saveCollectionWindowsAction,
  saveOpeningHoursAction,
  savePickupPointAction,
  type PickupActionState,
} from "@/app/admin/puntos-de-recogida/actions";
import { PICKUP_EXCEPTION_TYPE_LABELS_ES, WEEKDAY_LABELS_ES } from "@/lib/pickup-points-domain";
import { Alert, Button, Checkbox, Input, Select, Textarea } from "@/components/ui";
import type { Database } from "@/lib/supabase/database.types";

const initial: PickupActionState = { ok: false };

type PointDefaults = Partial<Database["public"]["Tables"]["pickup_points"]["Row"]>;

export function PickupPointForm({ defaults }: { defaults?: PointDefaults }) {
  const [state, action, pending] = useActionState(savePickupPointAction, initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    addEventListener("beforeunload", guard);
    return () => removeEventListener("beforeunload", guard);
  }, [dirty]);
  const d = <K extends keyof PointDefaults>(key: K) => defaults?.[key];

  return (
    <form
      action={action}
      className="admin-form admin-form--product"
      onChange={() => setDirty(true)}
      onSubmit={(event) => { if (!confirm("¿Quieres guardar estos cambios?")) event.preventDefault(); else setDirty(false); }}
    >
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <fieldset className="admin-fieldset">
        <legend>Identificación</legend>
        <Input id="point-name" name="name" label="Nombre" required defaultValue={d("name") ?? ""} error={state.errors?.name} />
        <Input id="point-slug" name="slug" label="Slug" pattern="[a-z0-9-]+" required defaultValue={d("slug") ?? ""} error={state.errors?.slug} />
        <Select id="point-type" name="type" label="Tipo" defaultValue={d("type") ?? "external"}>
          <option value="bakery">Obrador</option>
          <option value="external">Punto externo</option>
        </Select>
        <Checkbox id="point-main" name="is_main_bakery" label="Es el obrador principal" description="Solo puede haber uno. Marcarlo aquí desmarca cualquier otro." defaultChecked={d("is_main_bakery") ?? false} />
        {state.errors?.is_main_bakery ? <Alert variant="error" title="Revisa el tipo">{state.errors.is_main_bakery}</Alert> : null}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Localización</legend>
        <Input id="point-address1" name="address_line_1" label="Dirección" optional defaultValue={d("address_line_1") ?? ""} />
        <Input id="point-address2" name="address_line_2" label="Dirección (línea 2)" optional defaultValue={d("address_line_2") ?? ""} />
        <Input id="point-postal" name="postal_code" label="Código postal" optional defaultValue={d("postal_code") ?? ""} />
        <Input id="point-city" name="city" label="Ciudad" optional defaultValue={d("city") ?? ""} />
        <Input id="point-province" name="province" label="Provincia" optional defaultValue={d("province") ?? ""} />
        <Input id="point-country" name="country_code" label="País (ISO)" defaultValue={d("country_code") ?? "ES"} maxLength={2} error={state.errors?.country_code} />
        <Input id="point-lat" name="latitude" label="Latitud" type="number" step="0.000001" optional defaultValue={d("latitude") ?? ""} error={state.errors?.latitude} />
        <Input id="point-lng" name="longitude" label="Longitud" type="number" step="0.000001" optional defaultValue={d("longitude") ?? ""} error={state.errors?.longitude} />
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Recogida</legend>
        <Textarea id="point-instructions" name="public_instructions" label="Instrucciones públicas" helpText="Se muestran al cliente en la confirmación y en Dónde estamos." optional defaultValue={d("public_instructions") ?? ""} />
        <p className="field__help">El horario general, las ventanas de recogida y la capacidad habitual se configuran más abajo, una vez guardado el punto.</p>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Contacto interno</legend>
        <Input id="point-contact-name" name="contact_name" label="Responsable" optional defaultValue={d("contact_name") ?? ""} />
        <Input id="point-contact-phone" name="contact_phone" label="Teléfono" optional defaultValue={d("contact_phone") ?? ""} />
        <Input id="point-contact-email" name="contact_email" label="Correo" type="email" optional defaultValue={d("contact_email") ?? ""} error={state.errors?.contact_email} />
        <Textarea id="point-notes" name="internal_notes" label="Notas internas" helpText="Nunca se muestran en el sitio público." optional defaultValue={d("internal_notes") ?? ""} />
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Publicación</legend>
        <Select id="point-status" name="status" label="Estado" defaultValue={d("status") ?? "draft"}>
          <option value="draft">Borrador</option>
          <option value="active">Activo</option>
          <option value="temporarily_unavailable">Temporalmente no disponible</option>
          <option value="coming_soon">Próximamente</option>
          <option value="inactive">Inactivo</option>
        </Select>
        <Checkbox id="point-public" name="is_public" label="Visible en Dónde estamos" description="Solo se muestra si además el estado es Activo o Próximamente." defaultChecked={d("is_public") ?? false} />
        <Input id="point-order" name="display_order" label="Orden" type="number" min="0" defaultValue={d("display_order") ?? 0} />
      </fieldset>

      <Button type="submit" loading={pending}>Guardar punto</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

type Hours = Database["public"]["Tables"]["pickup_point_opening_hours"]["Row"];

export function OpeningHoursForm({ pointId, hours }: { pointId: string; hours: Hours[] }) {
  const byWeekday = (weekday: number) => hours.find((h) => h.weekday === weekday);
  return (
    <form action={saveOpeningHoursAction} className="admin-form">
      <input type="hidden" name="pickup_point_id" value={pointId} />
      <p className="field__help">Horario general del establecimiento. Es informativo: no sustituye a la ventana de recogida FUERZA.</p>
      {WEEKDAY_LABELS_ES.map((label, i) => {
        const weekday = i + 1;
        const row = byWeekday(weekday);
        return (
          <div key={weekday} className="admin-fieldset">
            <strong>{label}</strong>
            <Checkbox id={`hours-closed-${weekday}`} name={`hours_closed_${weekday}`} label="Cerrado" defaultChecked={row?.is_closed ?? false} />
            <Input id={`hours-open-${weekday}`} name={`hours_open_${weekday}`} label="Abre" type="time" optional defaultValue={row?.opens_at ?? ""} />
            <Input id={`hours-close-${weekday}`} name={`hours_close_${weekday}`} label="Cierra" type="time" optional defaultValue={row?.closes_at ?? ""} />
          </div>
        );
      })}
      <Button type="submit">Guardar horario</Button>
    </form>
  );
}

type Window = Database["public"]["Tables"]["pickup_point_collection_windows"]["Row"];

export function CollectionWindowsForm({ pointId, windows }: { pointId: string; windows: Window[] }) {
  const [state, action, pending] = useActionState(saveCollectionWindowsAction, initial);
  const rowCount = Math.max(4, windows.length + 2);
  const rows = Array.from({ length: rowCount }, (_, i) => windows[i]);
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="pickup_point_id" value={pointId} />
      <p className="field__help">Cuándo se puede recoger un pedido FUERZA en este punto. Puede haber más de una ventana el mismo día.</p>
      {rows.map((row, i) => (
        <div key={i} className="admin-fieldset">
          <Select id={`window-weekday-${i}`} name={`window_weekday_${i}`} label="Día" defaultValue={row?.weekday ?? ""}>
            <option value="">Sin usar</option>
            {WEEKDAY_LABELS_ES.map((label, wi) => <option key={label} value={wi + 1}>{label}</option>)}
          </Select>
          <Input id={`window-start-${i}`} name={`window_start_${i}`} label="Inicio" type="time" optional defaultValue={row?.starts_at ?? ""} />
          <Input id={`window-end-${i}`} name={`window_end_${i}`} label="Fin" type="time" optional defaultValue={row?.ends_at ?? ""} />
          <Checkbox id={`window-active-${i}`} name={`window_active_${i}`} label="Activa" defaultChecked={row?.is_active ?? true} />
        </div>
      ))}
      <Button type="submit" loading={pending}>Guardar ventanas</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

type Capacity = Database["public"]["Tables"]["pickup_point_capacity_defaults"]["Row"];

export function CapacityDefaultsForm({ pointId, capacity }: { pointId: string; capacity: Capacity[] }) {
  const byWeekday = (weekday: number) => capacity.find((c) => c.weekday === weekday);
  return (
    <form action={saveCapacityDefaultsAction} className="admin-form">
      <input type="hidden" name="pickup_point_id" value={pointId} />
      <p className="field__help">Capacidad logística total del punto por día. Si no marcas &quot;Configurado&quot;, ese día no es reservable: no es lo mismo que capacidad cero, que es un cierre explícito a nuevas reservas.</p>
      {WEEKDAY_LABELS_ES.map((label, i) => {
        const weekday = i + 1;
        const row = byWeekday(weekday);
        return (
          <div key={weekday} className="admin-fieldset">
            <strong>{label}</strong>
            <Checkbox id={`capacity-configured-${weekday}`} name={`capacity_configured_${weekday}`} label="Configurado" defaultChecked={row !== undefined} />
            <Input id={`capacity-${weekday}`} name={`capacity_${weekday}`} label="Unidades máximas" type="number" min="0" helpText="0 significa cerrado a nuevas reservas ese día." optional defaultValue={row?.max_units ?? ""} />
          </div>
        );
      })}
      <Button type="submit">Guardar capacidad</Button>
    </form>
  );
}

type Exception = Database["public"]["Tables"]["pickup_point_exceptions"]["Row"];

export function ExceptionsPanel({ pointId, exceptions, onDelete }: { pointId: string; exceptions: Exception[]; onDelete: (formData: FormData) => void }) {
  const [state, action, pending] = useActionState(createExceptionAction, initial);
  const [type, setType] = useState<Exception["type"]>("closed");
  return (
    <div className="admin-form">
      {exceptions.length ? (
        <ul className="admin-exception-list">
          {exceptions.map((exception) => (
            <li key={exception.id}>
              <span>{exception.exception_date} · {PICKUP_EXCEPTION_TYPE_LABELS_ES[exception.type]}</span>
              {exception.public_message ? <span> · {exception.public_message}</span> : null}
              <form action={onDelete}>
                <input type="hidden" name="id" value={exception.id} />
                <input type="hidden" name="pickup_point_id" value={pointId} />
                <Button type="submit" variant="destructive">Eliminar</Button>
              </form>
            </li>
          ))}
        </ul>
      ) : <p className="field__help">No hay excepciones para este punto.</p>}

      <form action={action} className="admin-form" onChange={(event) => { const target = event.target as unknown as HTMLSelectElement; if (target.name === "type") setType(target.value as Exception["type"]); }}>
        <input type="hidden" name="pickup_point_id" value={pointId} />
        <Input id="exception-date" name="exception_date" label="Fecha" type="date" required error={state.errors?.exception_date} />
        <Select id="exception-type" name="type" label="Tipo" defaultValue="closed">
          <option value="closed">Cerrado</option>
          <option value="extraordinary_opening">Apertura extraordinaria</option>
          <option value="schedule_override">Horario distinto</option>
          <option value="capacity_override">Capacidad distinta</option>
        </Select>
        {type === "extraordinary_opening" || type === "schedule_override" ? (
          <>
            <Input id="exception-start" name="collection_starts_at" label="Inicio de recogida" type="time" />
            <Input id="exception-end" name="collection_ends_at" label="Fin de recogida" type="time" />
          </>
        ) : null}
        {type === "capacity_override" ? <Input id="exception-capacity" name="capacity_override" label="Capacidad para ese día" type="number" min="0" /> : null}
        <Input id="exception-public" name="public_message" label="Mensaje público" optional />
        <Input id="exception-internal" name="internal_reason" label="Motivo interno" optional />
        <Button type="submit" loading={pending}>Añadir excepción</Button>
        {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardada" : "No se ha guardado"}>{state.message}</Alert> : null}
      </form>
    </div>
  );
}

type Product = { id: string; name: string };

export function AcceptedProductsForm({ pointId, acceptsAll, products, acceptedIds }: { pointId: string; acceptsAll: boolean; products: Product[]; acceptedIds: string[] }) {
  return (
    <form action={saveAcceptedProductsAction} className="admin-form">
      <input type="hidden" name="pickup_point_id" value={pointId} />
      <Checkbox id="accepts-all" name="accepts_all_products" label="Acepta todos los productos activos" defaultChecked={acceptsAll} />
      <fieldset className="admin-fieldset">
        <legend>Productos concretos (si no acepta todos)</legend>
        {products.map((product) => (
          <Checkbox key={product.id} id={`product-${product.id}`} name="product_id" value={product.id} label={product.name} defaultChecked={acceptedIds.includes(product.id)} />
        ))}
      </fieldset>
      <Button type="submit">Guardar productos aceptados</Button>
    </form>
  );
}
