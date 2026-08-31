"use client";
import Image from "next/image";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";

import { saveFamilyAction, saveProductAction, type CatalogActionState } from "@/app/admin/productos/actions";
import { Alert, Badge, Button, Checkbox, Input, Select, Textarea } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { productAttributeGroups } from "@/lib/product-attributes";

const initial: CatalogActionState = { ok: false };

type FamilyDefaults = { id: string; name: string; slug: string; description: string | null; color_key: string; display_order: number; status: string };

export function FamilyForm({ defaults, onSaved }: { defaults?: FamilyDefaults; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveFamilyAction, initial);
  const suffix = defaults?.id ?? "new";
  useEffect(() => { if (state.ok) onSaved?.(); }, [state.ok, onSaved]);
  return (
    <form action={action} className="admin-form">
      {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <Input id={`family-name-${suffix}`} name="name" label="Nombre" required defaultValue={defaults?.name} />
      <Input id={`family-slug-${suffix}`} name="slug" label="Slug" pattern="[a-z0-9-]+" required defaultValue={defaults?.slug} />
      <Textarea id={`family-description-${suffix}`} name="description" label="Descripción" optional defaultValue={defaults?.description ?? ""} />
      <Select id={`family-color-${suffix}`} name="color_key" label="Color" defaultValue={defaults?.color_key ?? "terracota"}>
        <option value="terracota">Terracota</option>
        <option value="amarillo">Amarillo</option>
        <option value="verde">Verde</option>
        <option value="azul">Azul</option>
      </Select>
      <Input id={`family-order-${suffix}`} name="display_order" label="Orden" type="number" min="0" defaultValue={defaults?.display_order ?? 0} />
      <Select id={`family-status-${suffix}`} name="status" label="Estado" defaultValue={defaults?.status ?? "hidden"}>
        <option value="hidden">Oculta</option>
        <option value="active">Activa</option>
      </Select>
      <Button type="submit" loading={pending}>Guardar familia</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardada" : "No guardada"}>{state.message}</Alert> : null}
    </form>
  );
}

type Family = { id: string; name: string };
type Allergen = { id: string; name: string };
type ProductDefaults = Record<string, string | number | null | undefined>;
type VariantDefault = { name: string; approximate_weight_grams: number | null; price_cents: number | null; vat_rate: number };
type ProductImage = { storage_path: string; alt_text: string | null };

const TABS = ["Información", "Venta", "Características", "Variantes", "Disponibilidad"] as const;
const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "seasonal", label: "De temporada" },
  { value: "unavailable", label: "No disponible" },
  { value: "discontinued", label: "Retirado" },
];
const MAX_VARIANTS = 10;

export function ProductForm({
  families, allergens, defaults, variants = [], contains = [], mayContain = [], weekdays = [], attributes = [], image,
}: {
  families: Family[]; allergens: Allergen[]; defaults?: ProductDefaults; variants?: VariantDefault[];
  contains?: string[]; mayContain?: string[]; weekdays?: number[]; attributes?: string[]; image?: ProductImage | null;
}) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState(0);
  const d = (key: string) => defaults?.[key] ?? "";

  const [variantRows, setVariantRows] = useState(() =>
    (variants.length ? variants : [{ name: "Única", approximate_weight_grams: null, price_cents: null, vat_rate: 0 }]).map((v, i) => ({ key: i, ...v })),
  );
  const [previewName, setPreviewName] = useState(String(d("name")));
  const [previewDescription, setPreviewDescription] = useState(String(d("short_description")));
  const [previewStatus, setPreviewStatus] = useState(String(d("status") || "draft"));

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    addEventListener("beforeunload", guard);
    return () => removeEventListener("beforeunload", guard);
  }, [dirty]);

  // Los errores de validación pueden pertenecer a una pestaña que no es la
  // activa (p.ej. el nombre, en Información, con el usuario en Variantes) --
  // sin esto, un campo obligatorio vacío en una pestaña oculta fallaría en el
  // servidor sin que se viera ningún aviso en pantalla. Se ajusta durante el
  // render (comparando con el estado anterior) en vez de en un efecto, para
  // no disparar un ciclo de render extra.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    const keys = Object.keys(state.errors ?? {});
    if (keys.length) {
      const infoFields = ["name", "slug", "family_id", "short_description"];
      if (keys.some((k) => infoFields.includes(k))) setTab(0);
      else if (keys.some((k) => k.startsWith("price_"))) setTab(3);
    }
  }

  const hasFlourInfo = Boolean(d("flour_type") || d("flour_origin") || d("fermentation_hours"));
  const hasSeo = Boolean(d("seo_title") || d("seo_description"));
  const nextVariantKey = variantRows.length ? Math.max(...variantRows.map((r) => r.key)) + 1 : 0;
  const previewPrices = variantRows.map((r) => r.price_cents).filter((p): p is number => p != null);

  return (
    <form
      action={action}
      className="admin-form admin-form--product"
      onChange={() => setDirty(true)}
      onSubmit={(e) => { if (!confirm("¿Quieres guardar estos cambios?")) e.preventDefault(); else setDirty(false); }}
    >
      {defaults?.id ? <input type="hidden" name="id" value={String(defaults.id)} /> : null}

      <div className="product-editor">
        <div className="product-editor__main">
          {!state.ok && !state.message && Object.keys(state.errors ?? {}).length ? (
            <Alert variant="error" title="Revisa los campos marcados">Hay campos obligatorios sin completar en alguna de las pestañas.</Alert>
          ) : null}
          <div className="form-tabs" role="tablist" aria-label="Secciones del producto">
            {TABS.map((label, index) => (
              <button key={label} type="button" role="tab" aria-selected={tab === index} onClick={() => setTab(index)}>{label}</button>
            ))}
          </div>

          <div className="form-tab-panel" hidden={tab !== 0}>
            <Input
              id="product-name" name="name" label="Nombre" defaultValue={String(d("name"))} required error={state.errors?.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPreviewName(e.target.value)}
            />
            <Input id="product-slug" name="slug" label="Slug" defaultValue={String(d("slug"))} required error={state.errors?.slug} />
            <Select id="product-family" name="family_id" label="Familia" defaultValue={String(d("family_id"))} required error={state.errors?.family_id}>
              <option value="">Selecciona</option>
              {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
            <Textarea
              id="product-short" name="short_description" label="Descripción corta" helpText="Aparece en las tarjetas del catálogo público."
              defaultValue={String(d("short_description"))} required error={state.errors?.short_description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPreviewDescription(e.target.value)}
            />
            <Textarea id="product-long" name="long_description" label="Descripción completa" optional defaultValue={String(d("long_description"))} />
          </div>

          <div className="form-tab-panel" hidden={tab !== 1}>
            <Select
              id="product-status" name="status" label="Estado" defaultValue={String(d("status") || "draft")}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPreviewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Input id="product-order" name="display_order" label="Orden" type="number" min="0" helpText="Posición dentro de su familia en el catálogo." defaultValue={String(d("display_order") || "0")} />
            <details className="admin-accordion" open={hasSeo}>
              <summary>SEO avanzado<span className="admin-accordion__hint">Opcional — se usan valores por defecto si se deja vacío</span></summary>
              <div className="admin-accordion__body">
                <Input id="seo-title" name="seo_title" label="Título SEO" maxLength={70} optional defaultValue={String(d("seo_title"))} />
                <Textarea id="seo-description" name="seo_description" label="Descripción SEO" maxLength={160} optional defaultValue={String(d("seo_description"))} />
              </div>
            </details>
          </div>

          <div className="form-tab-panel" hidden={tab !== 2}>
            <Input id="ingredients" name="ingredients" label="Ingredientes" helpText="Separados por comas." optional defaultValue={String(d("ingredients"))} />
            <details className="admin-accordion" open={hasFlourInfo}>
              <summary>Harina y fermentación<span className="admin-accordion__hint">Solo para panes de fermentación artesanal</span></summary>
              <div className="admin-accordion__body">
                <Input id="flour-type" name="flour_type" label="Tipo de harina" optional defaultValue={String(d("flour_type"))} />
                <Input id="flour-origin" name="flour_origin" label="Origen de la harina" optional defaultValue={String(d("flour_origin"))} />
                <Input id="fermentation" name="fermentation_hours" label="Fermentación (horas)" type="number" min="1" optional defaultValue={String(d("fermentation_hours"))} />
              </div>
            </details>
            <details className="admin-accordion" open>
              <summary>Alérgenos normativos<span className="admin-accordion__hint">Ley de información alimentaria — declaración obligatoria</span></summary>
              <div className="admin-accordion__body">
                <div className="admin-allergen-grid">
                  {allergens.map((a) => (
                    <div key={a.id} className="admin-allergen-row">
                      <p className="admin-allergen-row__name">{a.name}</p>
                      <Checkbox id={`contains-${a.id}`} name="allergen" value={a.id} label="Contiene" defaultChecked={contains.includes(a.id)} />
                      <Checkbox id={`may-${a.id}`} name="may_contain" value={a.id} label="Puede contener (trazas)" defaultChecked={mayContain.includes(a.id)} />
                    </div>
                  ))}
                </div>
              </div>
            </details>
            <details className="admin-accordion" open>
              <summary>Atributos, harinas y dietas<span className="admin-accordion__hint">Filtros del obrador para la web pública</span></summary>
              <div className="admin-accordion__body">
                {productAttributeGroups.map((group) => (
                  <div className="admin-attribute-group" key={group.key}>
                    <p className="admin-attribute-group__heading">{group.label}</p>
                    <div className="admin-checkbox-grid">
                      {group.attributes.map((attr) => (
                        <Checkbox key={attr.code} id={`attr-${attr.code}`} name="attribute" value={attr.code} label={attr.label} defaultChecked={attributes.includes(attr.code)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="form-tab-panel" hidden={tab !== 3}>
            {variantRows.map((row, i) => (
              <fieldset className="admin-fieldset product-variant-row" key={row.key}>
                <legend>Variante {i + 1}</legend>
                <Input id={`variant-name-${row.key}`} name={`variant_name_${i}`} label="Nombre" defaultValue={row.name ?? ""} />
                <Input id={`weight-${row.key}`} name={`weight_grams_${i}`} label="Peso aproximado (g)" type="number" min="1" optional defaultValue={row.approximate_weight_grams ?? ""} />
                <Input
                  id={`price-${row.key}`} name={`price_${i}`} label="Precio (€)" type="number" min="0" step="0.01" helpText="Ej: 4,50"
                  defaultValue={row.price_cents != null ? (row.price_cents / 100).toFixed(2) : ""} error={state.errors?.[`price_${i}`]}
                />
                <Input id={`vat-${row.key}`} name={`vat_rate_${i}`} label="IVA (%)" type="number" min="0" max="100" step="0.01" defaultValue={row.vat_rate ?? 0} />
                <Button type="button" variant="secondary" disabled={variantRows.length <= 1} onClick={() => setVariantRows((prev) => prev.filter((r) => r.key !== row.key))}>
                  Quitar variante
                </Button>
              </fieldset>
            ))}
            <Button
              type="button" variant="secondary" disabled={variantRows.length >= MAX_VARIANTS}
              onClick={() => setVariantRows((prev) => [...prev, { key: nextVariantKey, name: "", approximate_weight_grams: null, price_cents: null, vat_rate: 0 }])}
            >
              Añadir variante
            </Button>
          </div>

          <div className="form-tab-panel" hidden={tab !== 4}>
            <fieldset className="admin-fieldset">
              <legend>Días habituales de producción</legend>
              <p className="field__help">Marca los días en los que este producto suele hornearse. La capacidad exacta de cada fecha se ajusta en Disponibilidad.</p>
              <div className="admin-checkbox-grid">
                {WEEKDAY_NAMES.map((name, i) => (
                  <Checkbox key={name} id={`day-${i + 1}`} name="weekday" value={i + 1} label={name} defaultChecked={weekdays.includes(i + 1)} />
                ))}
              </div>
            </fieldset>
          </div>

          <div className="admin-form__submit">
            <Button type="submit" loading={pending}>Guardar producto</Button>
            {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
          </div>
        </div>

        <aside className="product-preview" aria-label="Vista previa en la tienda">
          <p className="product-preview__label">Así se verá en la tienda</p>
          <div className="product-preview__card">
            {image ? (
              <div className="product-preview__image-wrap">
                <Image src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? previewName} fill sizes="20rem" style={{ objectFit: "cover" }} />
              </div>
            ) : (
              <div className="product-preview__image-wrap product-preview__image-wrap--placeholder">Sin imagen</div>
            )}
            <div className="product-preview__body">
              <p className="product-preview__name">{previewName || "Nombre del producto"}</p>
              <p className="product-preview__description">{previewDescription || "Descripción corta…"}</p>
              <p className="product-preview__price">{previewPrices.length ? formatPrice(Math.min(...previewPrices)) : "Sin precio"}</p>
            </div>
          </div>
          {previewStatus !== "active" ? <Badge variant="neutral">No visible en la tienda mientras no esté Activo</Badge> : null}
        </aside>
      </div>
    </form>
  );
}
