"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { usePickupPoint } from "@/components/catalog/pickup-point-provider";
import { ArrowRightIcon, CalendarIcon, ChevronRightIcon, ClockIcon, PinIcon } from "@/components/ui/icons";
import { isoWeekday } from "@/lib/order-cutoff";
import { SHORT_DAYS_ES, summarizeCollectionWindows } from "@/lib/pickup-schedule";

type Window = { weekday: number; startsAt: string; endsAt: string };

export type PlannerPoint = {
  id: string;
  name: string;
  isMain: boolean;
  address: string | null;
  mapUrl: string | null;
  windows: Window[];
  exception: { date: string; type: string; startsAt: string | null; endsAt: string | null } | null;
};

const DAYS_VISIBLE = 7;

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  const month = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(date).replace(".", "");
  return { weekday: SHORT_DAYS_ES[isoWeekday(iso) - 1], day: date.getUTCDate(), month };
}

/**
 * Franja que el punto publica para una fecha. Solo sirve para mostrar el
 * horario y atenuar días sin recogida: la validación real sigue en el
 * carrito y el checkout (evaluatePickupPointForDate).
 */
function windowFor(point: PlannerPoint, date: string, closures: { startsOn: string; endsOn: string }[]) {
  if (closures.some((c) => date >= c.startsOn && date <= c.endsOn)) return null;
  const exception = point.exception?.date === date ? point.exception : null;
  if (exception?.type === "closed") return null;
  if (exception?.startsAt && exception.endsAt) return { startsAt: exception.startsAt, endsAt: exception.endsAt };
  return point.windows.find((w) => w.weekday === isoWeekday(date)) ?? null;
}

export function PickupPlanner({ details, closures }: { details: PlannerPoint[]; closures: { startsOn: string; endsOn: string }[] }) {
  const { selectedId, select, date, minDate, setDate } = usePickupPoint();
  const [choosing, setChoosing] = useState(false);
  const point = details.find((p) => p.id === selectedId) ?? details[0];
  if (!point) return null;

  const start = date >= minDate && date <= addDays(minDate, DAYS_VISIBLE - 1) ? minDate : date;
  const days = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(start, i));
  const summary = summarizeCollectionWindows(point.windows);
  const canSwitch = details.length > 1;

  const cardBody = (
    <>
      {point.isMain ? (
        <span className="fz-point__media">
          <Image src="/images/home/obrador-fuerza-fachada.jpg" alt="" fill sizes="160px" />
        </span>
      ) : null}
      <span className="fz-point__body">
        <span className="fz-point__name">
          {point.name}
          {point.isMain ? <span className="fz-chip">Punto principal</span> : null}
        </span>
        {point.address ? (
          <span className="fz-point__line"><PinIcon />{point.address}</span>
        ) : null}
        {summary ? (
          <span className="fz-point__line"><ClockIcon />{summary}</span>
        ) : null}
      </span>
      {canSwitch ? <ChevronRightIcon className="fz-point__chevron" /> : <span />}
    </>
  );
  const cardClass = `fz-point${point.isMain ? " fz-point--photo" : ""}`;

  return (
    <section className="fz-planner" aria-labelledby="planner-title">
      <div className="fz-planner__col">
        <div className="fz-planner__head">
          <h2 id="planner-title">¿Cuándo quieres recogerlo?</h2>
          {/* La fecha elegida ya está en la cookie de recogida que lee /reserva-y-recoge. */}
          <Link className="fz-link" href="/reserva-y-recoge">
            <CalendarIcon />
            Ver disponibilidad
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="fz-dates" role="group" aria-label="Día de recogida">
          {days.map((day) => {
            const { weekday, day: dayNumber, month } = dateParts(day);
            const available = Boolean(windowFor(point, day, closures));
            return (
              <button
                key={day}
                type="button"
                className="fz-date"
                aria-pressed={day === date}
                aria-label={`${weekday} ${dayNumber} ${month}${available ? "" : ", sin recogida"}`}
                disabled={!available && day !== date}
                onClick={() => setDate(day)}
              >
                <span className="fz-date__weekday">{weekday}</span>
                <span className="fz-date__day">{dayNumber}</span>
                <span className="fz-date__month">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fz-planner__col">
        <div className="fz-planner__head">
          <h3>Punto de recogida</h3>
          {point.mapUrl ? (
            <a className="fz-link" href={point.mapUrl} target="_blank" rel="noopener noreferrer">
              Ver mapa
              <ArrowRightIcon />
            </a>
          ) : null}
        </div>
        {canSwitch ? (
          <button type="button" className={cardClass} aria-expanded={choosing} aria-controls="planner-points" onClick={() => setChoosing((v) => !v)}>
            <span className="sr-only">Cambiar punto de recogida. Seleccionado: </span>
            {cardBody}
          </button>
        ) : (
          <div className={cardClass}>{cardBody}</div>
        )}
        {canSwitch && choosing ? (
          <ul id="planner-points" className="fz-point-list">
            {details.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  aria-current={option.id === point.id || undefined}
                  onClick={() => {
                    select(option.id);
                    setChoosing(false);
                  }}
                >
                  <span>{option.name}</span>
                  {option.address ? <small>{option.address}</small> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Link className="fz-btn fz-btn--block" href="/reserva-y-recoge">
          Continuar
          <ArrowRightIcon />
        </Link>
      </div>
    </section>
  );
}
