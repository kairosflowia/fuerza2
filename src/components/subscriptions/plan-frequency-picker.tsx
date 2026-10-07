"use client";

import Link from "next/link";
import { useState } from "react";

import { ArrowRightIcon, RepeatIcon } from "@/components/ui/icons";
import { FREQUENCY_DESCRIPTIONS_ES, FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const FEATURED: SubscriptionFrequency = "biweekly";
const configureHref = (frequency: SubscriptionFrequency) => `/plan-de-pan/membresias?frecuencia=${frequency}`;

/**
 * Elección de frecuencia de la landing del Plan de Pan. Solo preselecciona:
 * el configurador (/plan-de-pan/membresias) recibe la frecuencia por la URL,
 * igual que antes.
 */
export function PlanFrequencyPicker() {
  const [selected, setSelected] = useState<SubscriptionFrequency>(FEATURED);

  return (
    <>
      <section className="fz-plan-section" aria-labelledby="frequency-title">
        <p className="fz-eyebrow">A tu ritmo</p>
        <h2 id="frequency-title" className="fz-display">Elige tu frecuencia ideal</h2>
        <div className="fz-frequencies" role="radiogroup" aria-labelledby="frequency-title">
          {FREQUENCIES.map((frequency, index) => {
            const checked = selected === frequency;
            return (
              <div key={frequency} className="fz-frequency" data-selected={checked || undefined}>
                <label className="fz-frequency__choice">
                  <input
                    type="radio"
                    name="frecuencia"
                    value={frequency}
                    checked={checked}
                    onChange={() => setSelected(frequency)}
                    className="sr-only"
                  />
                  <span className="fz-frequency__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="fz-frequency__text">
                    <span className="fz-frequency__title">
                      {FREQUENCY_LABELS_ES[frequency]}
                      {frequency === FEATURED ? <span className="fz-frequency__badge">Más popular</span> : null}
                    </span>
                    <span className="fz-frequency__description">{FREQUENCY_DESCRIPTIONS_ES[frequency]}</span>
                  </span>
                  <span className="fz-frequency__radio" aria-hidden="true" />
                </label>
                <Link className="fz-frequency__action" href={configureHref(frequency)}>
                  Seleccionar<span className="sr-only">: {FREQUENCY_LABELS_ES[frequency]}</span>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="fz-flex-note">
          <RepeatIcon aria-hidden="true" />
          <span>
            <strong>Total flexibilidad</strong>
            Puedes pausar, retomar o cancelar tu plan en cualquier momento desde tu cuenta.
          </span>
        </p>
      </section>

      <div className="fz-plan-cta">
        <p>
          <strong>¿Listo para disfrutar de pan de verdad?</strong>
          <span>Configura tu Plan de Pan y nosotros nos encargamos del resto.</span>
        </p>
        <Link className="fz-btn" href={configureHref(selected)}>
          Configurar suscripción
          <ArrowRightIcon />
        </Link>
      </div>
    </>
  );
}
