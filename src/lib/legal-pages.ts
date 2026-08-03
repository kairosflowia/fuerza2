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
  "politica-de-cancelacion": { title:"Política de cancelación",description:"Borrador estructural pendiente de validación jurídica.",sections:["Solicitud de cancelación","Pedidos ya pagados","Plazos pendientes de decisión","Reembolsos"] },
  "politica-de-suscripcion": { title:"Política de suscripción",description:"Borrador estructural del Plan de Pan pendiente de validación.",sections:["Cobro recurrente","Pausa y reanudación","Cambios de plan","Cancelación"] },
  "informacion-alergenos": { title:"Información sobre alérgenos",description:"Información estructural que debe completarse con los datos reales de cada producto.",sections:["Declaración de alérgenos","Contaminación cruzada","Información por producto","Consultas antes de comprar"] },
} as const;

export type LegalSlug = keyof typeof legalPages;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}
