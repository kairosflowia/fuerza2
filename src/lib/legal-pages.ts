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
  "politica-de-cancelacion": {
    title: "Política de cancelación",
    description: "Cómo cancelar un pedido y qué ocurre con el pago, según la antelación con la que canceles.",
    sections: ["Solicitud de cancelación", "Pedidos todavía sin pagar", "Cancelación con 48 horas o más de antelación", "Cancelación con menos de 48 horas de antelación"],
    content: [
      {
        heading: "Solicitud de cancelación",
        paragraphs: [
          "Puedes cancelar tu pedido desde el enlace privado que recibiste al confirmarlo, en la página de tu pedido.",
          "Un pedido que el obrador ya ha preparado (marcado como listo para recoger) no puede cancelarse por esta vía: escríbenos directamente.",
        ],
      },
      {
        heading: "Pedidos todavía sin pagar",
        paragraphs: ["Si cancelas antes de completar el pago, el pedido se anula sin más: no hay ningún cargo que devolver."],
      },
      {
        heading: "Cancelación con 48 horas o más de antelación",
        paragraphs: [
          "Si quedan 48 horas o más para la hora de recogida, te devolvemos el importe íntegro al mismo método de pago con el que compraste. La devolución puede tardar unos días en reflejarse, según tu banco o entidad.",
        ],
      },
      {
        heading: "Cancelación con menos de 48 horas de antelación",
        paragraphs: [
          "La producción de tu pedido empieza 48 horas antes de la recogida. Si cancelas con menos de 48 horas de antelación, en vez de una devolución emitimos un vale por el importe íntegro, que podrás usar en un pedido futuro.",
        ],
      },
    ],
  },
  "politica-de-suscripcion": { title:"Política de suscripción",description:"Borrador estructural del Plan de Pan pendiente de validación.",sections:["Cobro recurrente","Pausa y reanudación","Cambios de plan","Cancelación"] },
  "informacion-alergenos": { title:"Información sobre alérgenos",description:"Información estructural que debe completarse con los datos reales de cada producto.",sections:["Declaración de alérgenos","Contaminación cruzada","Información por producto","Consultas antes de comprar"] },
} as const;

export type LegalSlug = keyof typeof legalPages;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}
