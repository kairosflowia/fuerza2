"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { availabilityReasonLabel } from "@/lib/availability-domain";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime } from "@/lib/order-cutoff";
import {
  FREQUENCY_LABELS_ES,
  FREQUENCY_PERIOD_ES,
  PLAN_WEEKDAYS,
  WEEKDAY_NAMES_ES,
  basketDiscountPercent,
  receiveSentenceEs,
  type SubscriptionFrequency,
} from "@/lib/subscriptions-domain";

import { SubscriptionPayment } from "./subscription-payment";

export type OnboardingProduct = {
  variantId: string;
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imagePath: string | null;
  productionWeekdays: number[];
};

export type OnboardingPoint = {
  id: string;
  name: string;
  address: string | null;
  acceptsAllProducts: boolean;
  acceptedProductIds: string[];
  windows: { weekday: number; startsAt: string; endsAt: string }[];
};

type Quote =
  | { status: "idle" | "loading" }
  | { status: "ok"; collectionDates: string[]; subtotalCents: number; discountPercent: number; totalCents: number; deliveries: number }
  | { status: "error"; message: string };

const STEPS = ["Panes", "Ritmo", "Recogida", "Preferencias", "Resumen"] as const;
const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const DRAFT_KEY = "fz-plan-de-pan-draft";
const MAX_QUANTITY = 20;
const NOTE_MAX = 500;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const joinEs = (parts: string[]) => (parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`);

const REASON_MESSAGES: Record<string, string> = {
  invalid_weekday: "Elige al menos un día de recogida.",
  invalid_basket: "Añade al menos un pan a tu plan.",
  cutoff_passed: "No hay ninguna semana próxima en la que todos los días elegidos estén disponibles. Prueba con otros días.",
  no_bookable_week: "No hay ninguna semana próxima en la que todos los días elegidos estén disponibles. Prueba con otros días.",
  variant_not_subscribable: "Uno de los panes ya no está disponible para el Plan de Pan.",
  note_too_long: "Las observaciones no pueden superar los 500 caracteres.",
};
const reasonMessage = (reason: string) => REASON_MESSAGES[reason] ?? `${availabilityReasonLabel(reason)}. Prueba con otro día o punto de recogida.`;

type Draft = {
  step: number;
  quantities: Record<string, number>;
  frequency: SubscriptionFrequency;
  weekdays: number[];
  pointId: string;
  wantsNewBreads: boolean;
  allowSubstitution: boolean;
  note: string;
};

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Sin almacenamiento (modo privado): el configurador sigue funcionando, solo no se recupera tras iniciar sesión.
  }
}

/**
 * Configurador del Plan de Pan en 5 pasos. Solo orienta (qué días y puntos
 * son compatibles con los datos publicados); disponibilidad real, precio y
 * fechas los decide la base de datos en /api/subscriptions/quote y /create.
 */
export function PlanOnboarding({
  products,
  points,
  initialFrequency,
  isLoggedIn,
}: {
  products: OnboardingProduct[];
  points: OnboardingPoint[];
  initialFrequency?: SubscriptionFrequency;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(initialFrequency ?? "weekly");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [pointId, setPointId] = useState("");
  const [wantsNewBreads, setWantsNewBreads] = useState(false);
  const [allowSubstitution, setAllowSubstitution] = useState(false);
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [payment, setPayment] = useState<{ clientSecret: string; subscriptionId: string } | null>(null);
  const restored = useRef(false);

  // Al volver de iniciar sesión se recupera la configuración guardada.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readDraft();
    if (!draft) return;
    const validIds = new Set(products.map((p) => p.variantId));
    setQuantities(Object.fromEntries(Object.entries(draft.quantities).filter(([id, q]) => validIds.has(id) && q > 0)));
    setFrequency(draft.frequency);
    setWeekdays(draft.weekdays);
    setPointId(draft.pointId);
    setWantsNewBreads(draft.wantsNewBreads);
    setAllowSubstitution(draft.allowSubstitution);
    setNote(draft.note);
    setStep(searchParams.get("paso") === "5" ? 5 : draft.step);
  }, [products, searchParams]);

  const items = useMemo(() => products.filter((p) => (quantities[p.variantId] ?? 0) > 0), [products, quantities]);
  const units = items.reduce((sum, p) => sum + quantities[p.variantId], 0);
  const deliveryTotal = items.reduce((sum, p) => sum + p.priceCents * quantities[p.variantId], 0);

  const acceptsItems = (point: OnboardingPoint) => point.acceptsAllProducts || items.every((p) => point.acceptedProductIds.includes(p.productId));
  const pointsForItems = points.filter(acceptsItems);
  const dayUnavailableReason = (day: number): string | null => {
    if (items.some((p) => !p.productionWeekdays.includes(day))) return "No horneamos tus panes ese día";
    if (!pointsForItems.some((point) => point.windows.some((w) => w.weekday === day))) return "No hay recogida ese día";
    return null;
  };
  const compatiblePoints = pointsForItems.filter((point) => weekdays.every((day) => point.windows.some((w) => w.weekday === day)));

  // Si cambian los panes, se descartan los días que dejan de ser posibles.
  useEffect(() => {
    setWeekdays((current) => current.filter((day) => !dayUnavailableReason(day)));
  }, [items.map((p) => p.variantId).join(",")]);

  // Punto: si solo hay uno compatible se preselecciona; si el elegido deja de serlo, se limpia.
  useEffect(() => {
    if (pointId && !compatiblePoints.some((p) => p.id === pointId)) setPointId("");
    else if (!pointId && compatiblePoints.length === 1) setPointId(compatiblePoints[0].id);
  }, [compatiblePoints.map((p) => p.id).join(","), pointId]);

  const selectedPoint = points.find((p) => p.id === pointId) ?? null;
  const planRequest = () => ({
    items: items.map((p) => ({ variant_id: p.variantId, quantity: quantities[p.variantId] })),
    pickupPointId: pointId,
    weekdays,
    frequency,
    preferences: { wantsNewBreads, allowSubstitution, note },
  });

  // Paso 5: precio y próxima recogida calculados por la base de datos.
  useEffect(() => {
    if (step !== 5 || !items.length || !weekdays.length || !pointId) return;
    const controller = new AbortController();
    setQuote({ status: "loading" });
    fetch("/api/subscriptions/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(planRequest()), signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) setQuote({ status: "error", message: "No hemos podido calcular tu plan ahora mismo. Inténtalo de nuevo en unos minutos." });
        else if (!data.ok) setQuote({ status: "error", message: reasonMessage(data.reason) });
        else setQuote({ status: "ok", ...data });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setQuote({ status: "error", message: "No hemos podido calcular tu plan ahora mismo. Inténtalo de nuevo en unos minutos." });
      });
    return () => controller.abort();
  }, [step, JSON.stringify(quantities), weekdays.join(","), pointId]);

  const goTo = (next: number) => {
    setStep(next);
    setSubmitError("");
    // Cada paso empieza arriba: el título queda visible bajo la cabecera fija.
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const canContinue = step === 1 ? items.length > 0 : step === 2 ? weekdays.length > 0 : step === 3 ? Boolean(selectedPoint) : step === 4 ? note.length <= NOTE_MAX : quote.status === "ok";

  const setQuantity = (variantId: string, quantity: number) =>
    setQuantities((current) => ({ ...current, [variantId]: Math.max(0, Math.min(MAX_QUANTITY, quantity)) }));

  const toggleDay = (day: number) =>
    setWeekdays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)));

  async function continueToPayment() {
    const draft: Draft = { step: 5, quantities, frequency, weekdays, pointId, wantsNewBreads, allowSubstitution, note };
    if (!isLoggedIn) {
      writeDraft(draft);
      router.push(`/cuenta/acceder?next=${encodeURIComponent("/plan-de-pan/membresias?paso=5")}`);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const response = await fetch("/api/subscriptions/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(planRequest()) });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (response.status === 401) {
      writeDraft(draft);
      router.push(`/cuenta/acceder?next=${encodeURIComponent("/plan-de-pan/membresias?paso=5")}`);
      return;
    }
    if (!response.ok || !data.clientSecret) {
      setSubmitError(
        response.status === 503
          ? "El pago recurrente todavía no está disponible. Inténtalo más tarde."
          : data.error && data.error !== "invalid_request"
            ? reasonMessage(data.error)
            : "No hemos podido reservar tu plan. Revisa los pasos e inténtalo de nuevo.",
      );
      return;
    }
    writeDraft(null);
    setPayment({ clientSecret: data.clientSecret, subscriptionId: data.subscriptionId });
  }

  const daysLabel = capitalize(joinEs(weekdays.map((d) => WEEKDAY_NAMES_ES[d - 1])));
  const summaryText = items.length
    ? `${items.length} ${items.length === 1 ? "producto" : "productos"} · ${formatPrice(deliveryTotal)}`
    : "Ningún pan todavía";

  return (
    <div className="fz-onboarding">
      <div className="fz-container">
        <nav className="fz-progress" aria-label="Progreso">
          <p className="fz-progress__mobile">Paso {step} de {STEPS.length}</p>
          <div className="fz-progress__bar" aria-hidden="true"><span style={{ width: `${(step / STEPS.length) * 100}%` }} /></div>
          <ol className="fz-progress__steps">
            {STEPS.map((label, index) => {
              const number = index + 1;
              return (
                <li key={label} aria-current={number === step ? "step" : undefined} data-done={number < step || undefined}>
                  <span className="fz-progress__number" aria-hidden="true">{number < step ? <CheckIcon /> : number}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        </nav>

        {payment ? (
          <section className="fz-onboarding__step" aria-labelledby="payment-title">
            <p className="fz-eyebrow">Último paso</p>
            <h1 id="payment-title" className="fz-display">Añade tu método de pago</h1>
            <SubscriptionPayment clientSecret={payment.clientSecret} subscriptionId={payment.subscriptionId} />
          </section>
        ) : (
          <>
            {step === 1 ? (
              <section className="fz-onboarding__step" aria-labelledby="step-title">
                <p className="fz-eyebrow">Paso 1 · Panes</p>
                <h1 id="step-title" className="fz-display">¿Qué quieres recibir?</h1>
                <p className="fz-onboarding__lead">Combina los panes que quieras. Las cantidades son por entrega.</p>
                {products.length ? (
                  <ul className="fz-plan-products">
                    {products.map((product) => {
                      const quantity = quantities[product.variantId] ?? 0;
                      return (
                        <li key={product.variantId} className="fz-plan-product" data-selected={quantity > 0 || undefined}>
                          <span className="fz-plan-product__media">
                            {product.imagePath ? <Image src={`/api/product-images/${product.imagePath}`} alt="" width={160} height={160} sizes="80px" /> : null}
                          </span>
                          <span className="fz-plan-product__text">
                            <span className="fz-plan-product__name">{product.name}</span>
                            {product.description ? <span className="fz-plan-product__desc">{product.description}</span> : null}
                            <span className="fz-plan-product__price">{formatPrice(product.priceCents)}</span>
                          </span>
                          {quantity > 0 ? (
                            <span className="fz-qty" role="group" aria-label={`Cantidad de ${product.name}`}>
                              <button type="button" aria-label={`Quitar ${product.name}`} onClick={() => setQuantity(product.variantId, quantity - 1)}><MinusIcon /></button>
                              <output aria-live="polite">{quantity}</output>
                              <button type="button" aria-label={`Añadir ${product.name}`} onClick={() => setQuantity(product.variantId, quantity + 1)} disabled={quantity >= MAX_QUANTITY}><PlusIcon /></button>
                            </span>
                          ) : (
                            <button type="button" className="fz-add" aria-label={`Añadir ${product.name}`} onClick={() => setQuantity(product.variantId, 1)}><PlusIcon /></button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="fz-onboarding__empty">Ahora mismo no hay panes disponibles para el Plan de Pan. Vuelve pronto.</p>
                )}
                {units > 0 ? (
                  <p className="fz-onboarding__hint">
                    {basketDiscountPercent(units) > 0 ? "Tienes un 5% de descuento por llevar 4 o más panes por entrega." : "Con 4 o más panes por entrega tienes un 5% de descuento."}
                  </p>
                ) : null}
              </section>
            ) : null}

            {step === 2 ? (
              <section className="fz-onboarding__step" aria-labelledby="step-title">
                <p className="fz-eyebrow">Paso 2 · Ritmo</p>
                <h1 id="step-title" className="fz-display">Elige tu ritmo</h1>

                <fieldset className="fz-fieldset">
                  <legend>Frecuencia</legend>
                  <div className="fz-choice-row">
                    {FREQUENCIES.map((option) => (
                      <label key={option} className="fz-choice-pill" data-selected={frequency === option || undefined}>
                        <input type="radio" name="frecuencia" value={option} checked={frequency === option} onChange={() => setFrequency(option)} className="sr-only" />
                        {FREQUENCY_LABELS_ES[option]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="fz-fieldset">
                  <legend>Días de recogida</legend>
                  <p className="fz-fieldset__help">Puedes elegir uno o varios días.</p>
                  <div className="fz-day-grid">
                    {PLAN_WEEKDAYS.map((day) => {
                      const reason = dayUnavailableReason(day);
                      const selected = weekdays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className="fz-day"
                          aria-pressed={selected}
                          disabled={Boolean(reason)}
                          onClick={() => toggleDay(day)}
                        >
                          <span className="fz-day__name">{capitalize(WEEKDAY_NAMES_ES[day - 1])}</span>
                          {reason ? <span className="fz-day__reason">{reason}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="fz-rhythm-sentence" aria-live="polite">
                    {weekdays.length ? receiveSentenceEs(weekdays, frequency) : "Elige al menos un día."}
                  </p>
                </fieldset>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="fz-onboarding__step" aria-labelledby="step-title">
                <p className="fz-eyebrow">Paso 3 · Recogida</p>
                <h1 id="step-title" className="fz-display">¿Dónde quieres recogerlo?</h1>
                <p className="fz-onboarding__lead">Solo mostramos los puntos que tienen recogida {weekdays.length > 1 ? "todos los días elegidos" : "el día elegido"} y aceptan tus panes.</p>
                {compatiblePoints.length ? (
                  <div className="fz-point-choices" role="radiogroup" aria-labelledby="step-title">
                    {compatiblePoints.map((point) => {
                      const chosen = point.windows.filter((w) => weekdays.includes(w.weekday)).sort((a, b) => a.weekday - b.weekday);
                      const sameHours = chosen.every((w) => w.startsAt === chosen[0]?.startsAt && w.endsAt === chosen[0]?.endsAt);
                      return (
                        <label key={point.id} className="fz-point-choice" data-selected={pointId === point.id || undefined}>
                          <input type="radio" name="punto" value={point.id} checked={pointId === point.id} onChange={() => setPointId(point.id)} className="sr-only" />
                          <span className="fz-point-choice__radio" aria-hidden="true" />
                          <span className="fz-point-choice__body">
                            <span className="fz-point-choice__name">{point.name}</span>
                            {point.address ? <span className="fz-point-choice__line">{point.address}</span> : null}
                            <span className="fz-point-choice__line">Días: {joinEs(chosen.map((w) => WEEKDAY_NAMES_ES[w.weekday - 1]))}</span>
                            <span className="fz-point-choice__line">
                              Horario de recogida:{" "}
                              {sameHours && chosen[0]
                                ? `${formatTime(chosen[0].startsAt)} – ${formatTime(chosen[0].endsAt)}`
                                : chosen.map((w) => `${WEEKDAY_NAMES_ES[w.weekday - 1]} ${formatTime(w.startsAt)} – ${formatTime(w.endsAt)}`).join(" · ")}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="fz-onboarding__empty">Ningún punto de recogida tiene recogida {weekdays.length > 1 ? "todos esos días" : "ese día"} con estos panes. Vuelve al paso anterior y prueba con otros días.</p>
                )}
              </section>
            ) : null}

            {step === 4 ? (
              <section className="fz-onboarding__step" aria-labelledby="step-title">
                <p className="fz-eyebrow">Paso 4 · Preferencias</p>
                <h1 id="step-title" className="fz-display">Hazlo más tuyo</h1>
                <p className="fz-onboarding__lead">Opcional. El equipo del obrador lo verá al preparar cada pedido.</p>
                <div className="fz-pref-list">
                  <label className="fz-pref">
                    <input type="checkbox" checked={wantsNewBreads} onChange={(e) => setWantsNewBreads(e.target.checked)} />
                    <span><strong>Quiero probar panes nuevos</strong>Lo tendremos en cuenta al preparar tus entregas.</span>
                  </label>
                  <label className="fz-pref">
                    <input type="checkbox" checked={allowSubstitution} onChange={(e) => setAllowSubstitution(e.target.checked)} />
                    <span><strong>Permitir sustitución</strong>Si uno de tus panes no está disponible, podemos prepararte otro parecido.</span>
                  </label>
                  <label className="fz-pref fz-pref--note">
                    <span><strong>Observaciones</strong>Alergias, preferencias de corte o lo que debamos saber.</span>
                    <textarea value={note} maxLength={NOTE_MAX} rows={3} onChange={(e) => setNote(e.target.value)} />
                    <small>{note.length}/{NOTE_MAX}</small>
                  </label>
                </div>
              </section>
            ) : null}

            {step === 5 ? (
              <section className="fz-onboarding__step" aria-labelledby="step-title">
                <p className="fz-eyebrow">Paso 5 · Resumen</p>
                <h1 id="step-title" className="fz-display">Tu Plan de Pan</h1>
                <dl className="fz-plan-summary">
                  <div>
                    <dt>Panes por entrega</dt>
                    <dd>{items.map((p) => <span key={p.variantId}>{p.name} ×{quantities[p.variantId]}</span>)}</dd>
                  </div>
                  <div>
                    <dt>Ritmo</dt>
                    <dd><span>{FREQUENCY_LABELS_ES[frequency]}</span><span>{daysLabel}</span></dd>
                  </div>
                  <div>
                    <dt>Punto de recogida</dt>
                    <dd><span>{selectedPoint?.name}</span>{selectedPoint?.address ? <span className="fz-plan-summary__muted">{selectedPoint.address}</span> : null}</dd>
                  </div>
                  {wantsNewBreads || allowSubstitution || note.trim() ? (
                    <div>
                      <dt>Preferencias</dt>
                      <dd>
                        {wantsNewBreads ? <span>Quiero probar panes nuevos</span> : null}
                        {allowSubstitution ? <span>Permitir sustitución</span> : null}
                        {note.trim() ? <span className="fz-plan-summary__muted">“{note.trim()}”</span> : null}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Próxima recogida</dt>
                    <dd>
                      {quote.status === "ok"
                        ? quote.collectionDates.map((date) => <span key={date}>{formatDateEs(date)}</span>)
                        : <span className="fz-plan-summary__muted">{quote.status === "error" ? "—" : "Calculando…"}</span>}
                    </dd>
                  </div>
                </dl>

                {quote.status === "ok" ? (
                  <div className="fz-plan-price">
                    <p className="fz-plan-price__amount">{formatPrice(quote.totalCents)} <span>/ {FREQUENCY_PERIOD_ES[frequency]}</span></p>
                    <p className="fz-plan-price__detail">
                      {quote.deliveries > 1 ? `${quote.deliveries} entregas por periodo · ` : ""}
                      {quote.discountPercent > 0 ? `incluye un ${quote.discountPercent}% de descuento por 4 o más panes por entrega` : "precio por periodo"}
                    </p>
                  </div>
                ) : null}
                {quote.status === "error" ? <p className="fz-onboarding__error" role="alert">{quote.message}</p> : null}
                {submitError ? <p className="fz-onboarding__error" role="alert">{submitError}</p> : null}
                {!isLoggedIn ? <p className="fz-onboarding__hint">Para continuar al pago te pediremos que inicies sesión o crees tu cuenta. Tu plan se queda guardado.</p> : null}
              </section>
            ) : null}
          </>
        )}
      </div>

      {payment ? null : (
        <div className="fz-onboarding__bar">
          <div className="fz-container fz-onboarding__bar-inner">
            <p className="fz-onboarding__summary" aria-live="polite">{summaryText}</p>
            <div className="fz-onboarding__actions">
              {step > 1 ? (
                <button type="button" className="fz-btn-secondary" onClick={() => goTo(step - 1)}>
                  <ArrowLeftIcon />
                  <span className="sr-only">Volver al paso anterior</span>
                  <span aria-hidden="true" className="fz-onboarding__back-label">Atrás</span>
                </button>
              ) : null}
              {step < 5 ? (
                <button type="button" className="fz-btn" disabled={!canContinue} onClick={() => goTo(step + 1)}>
                  Continuar
                  <ArrowRightIcon />
                </button>
              ) : (
                <button type="button" className="fz-btn" disabled={!canContinue || submitting} onClick={continueToPayment}>
                  {submitting ? "Reservando…" : "Continuar al pago"}
                  {submitting ? null : <ArrowRightIcon />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
