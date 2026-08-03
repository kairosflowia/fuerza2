export const legalPages = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Estructura provisional del aviso legal de FUERZA.",
    sections: ["Titularidad del sitio", "Condiciones de uso", "Propiedad intelectual", "Responsabilidad"],
  },
  privacidad: {
    title: "Privacidad",
    description: "Estructura provisional de la política de privacidad de FUERZA.",
    sections: ["Responsable del tratamiento", "Datos tratados", "Finalidades y base jurídica", "Derechos y conservación"],
  },
  cookies: {
    title: "Cookies",
    description: "Estructura provisional de la política de cookies de FUERZA.",
    sections: ["Qué son las cookies", "Cookies utilizadas", "Preferencias", "Actualizaciones"],
  },
  "condiciones-de-compra": {
    title: "Condiciones de compra",
    description: "Estructura provisional de las condiciones de compra de FUERZA.",
    sections: ["Proceso de compra", "Pago y confirmación", "Recogida", "Cambios, cancelaciones y reembolsos"],
  },
} as const;

export type LegalSlug = keyof typeof legalPages;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}
