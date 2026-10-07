"use client";

import { CalendarIcon, ChevronDownIcon, StoreIcon } from "@/components/ui/icons";

import { usePickupPoint } from "./pickup-point-provider";

/** "Sáb, 10 oct 2026" (fecha ISO interpretada en UTC, igual que el resto del flujo). */
function formatPickupDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(date).replace(".", "");
  const weekday = part({ weekday: "short" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${part({ day: "numeric" })} ${part({ month: "short" })} ${part({ year: "numeric" })}`;
}

/**
 * Punto y fecha de recogida del catálogo. Los controles nativos (select y
 * date) quedan superpuestos de forma invisible sobre cada mitad: mismo
 * comportamiento que antes, con la presentación de la referencia.
 */
export function PickupBar() {
  const { points, selectedId, selected, select, date, minDate, setDate } = usePickupPoint();
  if (!points.length) return null;

  return (
    <div className="fz-pickup-bar">
      <div className="fz-pickup-bar__item">
        <StoreIcon className="fz-pickup-bar__icon" />
        <div className="fz-pickup-bar__text">
          <span className="fz-pickup-bar__label" id="pickup-point-label">Recogida en</span>
          <span className="fz-pickup-bar__value">
            {selected?.name ?? "Elige un punto"}
            <ChevronDownIcon />
          </span>
          {selected?.address ? <span className="fz-pickup-bar__meta">{selected.address}</span> : null}
        </div>
        <select
          className="fz-pickup-bar__native"
          aria-labelledby="pickup-point-label"
          value={selectedId}
          onChange={(event) => select(event.target.value)}
        >
          {points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}
        </select>
      </div>

      <div className="fz-pickup-bar__item">
        <CalendarIcon className="fz-pickup-bar__icon" />
        <div className="fz-pickup-bar__text" aria-hidden="true">
          <span className="fz-pickup-bar__label">Fecha de recogida</span>
          <span className="fz-pickup-bar__value">
            {formatPickupDate(date)}
            <ChevronDownIcon />
          </span>
        </div>
        <input
          className="fz-pickup-bar__native"
          type="date"
          aria-label={`Fecha de recogida: ${formatPickupDate(date)}`}
          value={date}
          min={minDate}
          onClick={(event) => {
            try {
              event.currentTarget.showPicker();
            } catch {
              // Navegadores sin showPicker abren el selector nativo al tocar el campo.
            }
          }}
          onChange={(event) => event.target.value && setDate(event.target.value)}
        />
      </div>
    </div>
  );
}
