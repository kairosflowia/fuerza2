export type SubscriptionFrequency = "weekly" | "biweekly" | "every_3_weeks" | "monthly";

export const FREQUENCY_LABELS_ES: Record<SubscriptionFrequency, string> = {
  weekly: "Cada semana",
  biweekly: "Cada 2 semanas",
  every_3_weeks: "Cada 3 semanas",
  monthly: "Cada mes",
};

export const FREQUENCY_DESCRIPTIONS_ES: Record<SubscriptionFrequency, string> = {
  weekly: "Ideal para quienes quieren mantener pan fresco de forma constante durante la semana.",
  biweekly: "Una opción intermedia para quienes quieren disfrutar con frecuencia, sin recibir todas las semanas.",
  every_3_weeks: "Un punto medio entre la opción quincenal y la mensual.",
  monthly: "Ideal si prefieres una opción más flexible, probar el sistema o complementar tus compras habituales.",
};

/** Mismo mapeo que usa Stripe para price_data.recurring en cada artículo de la suscripción. */
export function stripeRecurringInterval(frequency: SubscriptionFrequency): { interval: "week" | "month"; interval_count: number } {
  switch (frequency) {
    case "weekly":
      return { interval: "week", interval_count: 1 };
    case "biweekly":
      return { interval: "week", interval_count: 2 };
    case "every_3_weeks":
      return { interval: "week", interval_count: 3 };
    case "monthly":
      return { interval: "month", interval_count: 1 };
  }
}

export const SUBSCRIPTION_STATUS_LABELS_ES: Record<string, string> = {
  incomplete: "Incompleta",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago pendiente",
  paused: "Pausada",
  cancel_pending: "Se cancela al final del ciclo",
  cancelled: "Cancelada",
  unpaid: "Impago",
  requires_attention: "Requiere atención",
};

export const SUBSCRIPTION_STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "neutral" | "information"> = {
  active: "success",
  trialing: "success",
  paused: "warning",
  cancel_pending: "warning",
  past_due: "error",
  unpaid: "error",
  requires_attention: "error",
  cancelled: "neutral",
  incomplete: "neutral",
};

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS_ES[status] ?? status;
}

export const SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS = 4;
export const SUBSCRIPTION_DISCOUNT_PERCENT = 5;

/** Mismo umbral que create_subscription_basket(): 5% a partir de 4 unidades en la cesta. */
export function basketDiscountPercent(totalQuantity: number): number {
  return totalQuantity >= SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS ? SUBSCRIPTION_DISCOUNT_PERCENT : 0;
}

/** Días que se ofrecen en el Plan de Pan (lunes=1 … sábado=6, ISO 8601). */
export const PLAN_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;
export const WEEKDAY_NAMES_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const WEEKDAY_PLURALS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];

function joinEs(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`;
}

/** "los lunes y jueves", "los lunes, miércoles y sábados". */
export function weekdaysPhraseEs(weekdays: readonly number[]): string {
  const days = [...new Set(weekdays)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  return days.length ? `los ${joinEs(days.map((d) => WEEKDAY_PLURALS_ES[d - 1]))}` : "";
}

/** Frase de resumen del ritmo elegido: "Recibirás tu pan los lunes y jueves." */
export function receiveSentenceEs(weekdays: readonly number[], frequency: SubscriptionFrequency): string {
  const phrase = weekdaysPhraseEs(weekdays);
  if (!phrase) return "";
  switch (frequency) {
    case "weekly":
      return `Recibirás tu pan ${phrase}.`;
    case "biweekly":
      return `Recibirás tu pan ${phrase}, una semana sí y otra no.`;
    case "every_3_weeks":
      return `Recibirás tu pan ${phrase}, una semana de cada tres.`;
    case "monthly":
      return `Recibirás tu pan ${phrase} de una semana cada mes.`;
  }
}

/** Unidad del precio por periodo: "18,40 € / semana". */
export const FREQUENCY_PERIOD_ES: Record<SubscriptionFrequency, string> = {
  weekly: "semana",
  biweekly: "2 semanas",
  every_3_weeks: "3 semanas",
  monthly: "mes",
};

