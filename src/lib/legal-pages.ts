type LegalParagraphBlock = { heading: string; paragraphs: readonly string[] };
type LegalPendingBlock = { heading: string; pending: true; note: string };
export type LegalBlock = LegalParagraphBlock | LegalPendingBlock;

export function isPendingBlock(block: LegalBlock): block is LegalPendingBlock {
  return "pending" in block;
}

function content(blocks: readonly LegalBlock[]): readonly LegalBlock[] {
  return blocks;
}

const CONTACT_EMAIL = "hola@fuerza.com";

const titularPending: LegalPendingBlock = {
  heading: "Titularidad del sitio",
  pending: true,
  note: "Estamos completando los datos identificativos del titular (razón social, NIF/CIF y domicilio fiscal) antes de su publicación. Mientras tanto, puedes contactar con nosotros en " + CONTACT_EMAIL + " para cualquier consulta sobre esta información.",
};

export interface LegalOwnerIdentity {
  controllerName: string | null;
  taxId: string | null;
  fiscalAddress: string | null;
  contactEmail: string | null;
}

/** Sustituye el bloque de titularidad/responsable por los datos reales del
 * negocio en cuanto owner los haya completado en /admin/configuracion/legal
 * (razón social, NIF/CIF y domicilio son obligatorios; el correo legal es
 * opcional, cae al correo de contacto general si no se ha indicado). Hasta
 * entonces sigue mostrando el bloque pendiente. */
export function resolveTitularBlock(heading: string, identity: LegalOwnerIdentity | null): LegalBlock {
  if (!identity?.controllerName || !identity.taxId || !identity.fiscalAddress) {
    return { ...titularPending, heading };
  }
  const contactEmail = identity.contactEmail || CONTACT_EMAIL;
  return {
    heading,
    paragraphs: [
      `${identity.controllerName}, con NIF/CIF ${identity.taxId}, con domicilio en ${identity.fiscalAddress}.`,
      `Puedes contactar con nosotros en ${contactEmail}.`,
    ],
  };
}

export const legalPages = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Condiciones de uso del sitio web de FUERZA, propiedad intelectual y responsabilidad.",
    content: content([
      titularPending,
      {
        heading: "Condiciones de uso",
        paragraphs: [
          "Este sitio permite consultar el catálogo de pan de FUERZA, reservar pedidos para recoger en el obrador o en un punto de recogida, y gestionar tu cuenta y tus suscripciones de Fuerza Habitual.",
          "Al usar el sitio te comprometes a facilitar datos veraces al reservar o crear una cuenta, y a no utilizar el servicio de forma que perjudique su funcionamiento o el de otros usuarios.",
        ],
      },
      {
        heading: "Propiedad intelectual",
        paragraphs: [
          "Los textos, fotografías, logotipo y diseño de este sitio son propiedad de FUERZA o se utilizan con la autorización correspondiente. No está permitida su reproducción, distribución o uso comercial sin permiso previo por escrito.",
        ],
      },
      {
        heading: "Responsabilidad",
        paragraphs: [
          "Hacemos lo posible por mantener la disponibilidad y la exactitud del catálogo, los horarios y la capacidad de producción, pero pueden producirse cambios puntuales (por ejemplo, un punto de recogida cerrado por causa mayor). En ese caso, la reserva no mostrará una opción incompatible y te avisaremos si algo afecta a un pedido ya confirmado.",
          "Este sitio puede enlazar a redes sociales u otros servicios externos sobre los que no tenemos control ni responsabilidad por su contenido.",
        ],
      },
    ]),
  },
  privacidad: {
    title: "Privacidad",
    description: "Qué datos tratamos, con qué finalidad y qué derechos tienes sobre ellos.",
    content: content([
      { ...titularPending, heading: "Responsable del tratamiento" },
      {
        heading: "Datos tratados",
        paragraphs: [
          "Al crear una cuenta o reservar un pedido tratamos: nombre, correo electrónico, teléfono, y los datos del propio pedido (productos, punto y fecha de recogida, importe).",
          "El pago se procesa directamente por Stripe, nuestro proveedor de pagos: no almacenamos los datos de tu tarjeta en nuestros servidores.",
          "El acceso a tu cuenta se gestiona a través de Supabase, nuestro proveedor de autenticación y base de datos, que aloja de forma segura tus credenciales y tus datos.",
          "Si nos escribes por el formulario de contacto, tratamos los datos que incluyas en ese mensaje (nombre, correo, teléfono si lo indicas, y el contenido de tu consulta) para poder responderte.",
        ],
      },
      {
        heading: "Finalidades y base jurídica",
        paragraphs: [
          "Gestionar tu cuenta, tus pedidos y tus suscripciones de Fuerza Habitual: es necesario para ejecutar el contrato de compraventa o de suscripción que aceptas al reservar.",
          "Enviarte confirmaciones, recordatorios y avisos operativos sobre tus propios pedidos o suscripciones (por ejemplo, que tu pan ya está listo para recoger): también forma parte de la ejecución de ese contrato, no de comunicaciones comerciales.",
          "Responder a tus consultas a través del formulario de contacto: en base al consentimiento que das al enviar el formulario.",
          "No enviamos comunicaciones de marketing por correo salvo que te suscribas expresamente a nuestra newsletter, y siempre podrás darte de baja desde el propio correo.",
        ],
      },
      {
        heading: "Derechos y conservación",
        paragraphs: [
          `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${CONTACT_EMAIL}. Muchos de estos datos (nombre, teléfono, dirección) también puedes consultarlos y actualizarlos tú mismo desde tu cuenta.`,
          "Conservamos tus datos mientras mantengas una cuenta activa o una relación contractual con nosotros (pedidos o suscripción en curso), y después durante el plazo que exija la normativa fiscal y mercantil aplicable a los documentos de venta.",
          "Si consideras que no hemos tratado tus datos correctamente, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).",
        ],
      },
    ]),
  },
  cookies: {
    title: "Cookies",
    description: "Qué cookies utiliza FUERZA y para qué sirve cada una.",
    content: content([
      {
        heading: "Qué son las cookies",
        paragraphs: [
          "Las cookies son pequeños archivos que un sitio web guarda en tu navegador para recordar información entre visitas, como tu sesión iniciada o los productos de tu cesta.",
        ],
      },
      {
        heading: "Cookies utilizadas",
        paragraphs: [
          "Todas las cookies que utiliza FUERZA hoy son necesarias para el funcionamiento del sitio y no requieren consentimiento previo: mantener tu sesión iniciada, recordar el contenido de tu cesta y el punto de recogida que has elegido, aplicar medidas de seguridad (como el límite de intentos de acceso) y recordar tu elección sobre esta política de cookies.",
          "FUERZA no utiliza actualmente cookies de analítica ni de publicidad de terceros. Si en el futuro incorporamos alguna, actualizaremos esta página y volveremos a pedirte tu consentimiento antes de activarla.",
        ],
      },
      {
        heading: "Preferencias",
        paragraphs: [
          "Puedes bloquear o eliminar las cookies desde la configuración de tu navegador en cualquier momento, aunque algunas funciones (como mantener la sesión o la cesta) dejarán de funcionar correctamente sin ellas.",
        ],
      },
      {
        heading: "Actualizaciones",
        paragraphs: [
          "Si cambiamos el tipo de cookies que utilizamos, actualizaremos esta página y, cuando corresponda, te pediremos de nuevo tu consentimiento.",
        ],
      },
    ]),
  },
  "condiciones-de-compra": {
    title: "Condiciones de compra",
    description: "Cómo funciona una reserva en FUERZA, desde el pedido hasta la recogida.",
    content: content([
      {
        heading: "Proceso de compra",
        paragraphs: [
          "El pan de FUERZA se hace en cantidad limitada cada día, así que se compra por reserva: eliges los productos, la fecha y el punto de recogida disponibles, y confirmas el pedido.",
          "Cada reserva requiere un mínimo de antelación (48 horas) respecto a la fecha de recogida elegida, porque la producción empieza ese mismo plazo antes. El sistema solo te dejará elegir fechas que todavía admiten reserva.",
        ],
      },
      {
        heading: "Pago y confirmación",
        paragraphs: [
          "El pago se realiza online a través de Stripe en el momento de confirmar la reserva. En cuanto el pago se completa, recibirás un correo de confirmación con el detalle del pedido y un enlace privado para consultarlo.",
        ],
      },
      {
        heading: "Recogida",
        paragraphs: [
          "Recoges tu pedido en el punto y dentro de la franja horaria que elegiste al reservar. Te avisaremos cuando tu pedido esté listo para recoger.",
          "Un pedido no recogido no se puede reasignar automáticamente a otro día: si no vas a poder recogerlo, contáctanos con antelación.",
        ],
      },
      {
        heading: "Cambios, cancelaciones y reembolsos",
        paragraphs: [
          "Puedes cancelar un pedido desde el enlace privado de tu pedido. Las condiciones exactas (cuándo hay devolución íntegra y cuándo se emite un vale) dependen de la antelación con la que canceles: consulta la Política de cancelación para el detalle completo.",
        ],
      },
    ]),
  },
  "politica-de-cancelacion": {
    title: "Política de cancelación",
    description: "Cómo cancelar un pedido y qué ocurre con el pago, según la antelación con la que canceles.",
    content: content([
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
    ]),
  },
  "politica-de-suscripcion": {
    title: "Política de suscripción",
    description: "Cómo funciona Fuerza Habitual: cobro recurrente, pausas, cambios y cancelación.",
    content: content([
      {
        heading: "Cobro recurrente",
        paragraphs: [
          "Fuerza Habitual es una suscripción con la frecuencia que elijas (semanal, quincenal, cada 3 semanas o mensual). Se te cobra automáticamente al inicio de cada ciclo por los productos y la cantidad que hayas configurado en tu cesta habitual.",
          "Si tu cesta suma 4 unidades o más, se aplica automáticamente un 5 % de descuento sobre el importe del ciclo.",
        ],
      },
      {
        heading: "Pausa y reanudación",
        paragraphs: [
          "Puedes pausar tu suscripción en cualquier momento desde tu cuenta. Si el próximo ciclo todavía está a 48 horas o más de su fecha de recogida, se libera de inmediato y no se te cobra por él. Si está a menos de 48 horas, ese ciclo ya está en producción y sigue su curso con normalidad; la pausa se aplica a partir del siguiente.",
          "Puedes reanudarla cuando quieras: vuelve a activarse de inmediato para el próximo ciclo disponible.",
        ],
      },
      {
        heading: "Cambios de plan",
        paragraphs: [
          "Puedes cambiar los productos, la cantidad o la frecuencia de tu cesta habitual desde tu cuenta. Al igual que con la pausa, el ciclo que ya esté a menos de 48 horas de su recogida mantiene la configuración con la que se generó; el cambio se aplica desde el siguiente ciclo.",
        ],
      },
      {
        heading: "Cancelación",
        paragraphs: [
          "Puedes cancelar Fuerza Habitual en cualquier momento desde tu cuenta. Se aplica la misma regla de las 48 horas: si el ciclo pendiente está a 48 horas o más, se cancela de inmediato sin cargo; si está a menos, ese último ciclo se completa con normalidad y la suscripción no se renueva después.",
        ],
      },
    ]),
  },
  "informacion-alergenos": {
    title: "Información sobre alérgenos",
    description: "Cómo consultamos y comunicamos los alérgenos de cada producto.",
    content: content([
      {
        heading: "Declaración de alérgenos",
        paragraphs: [
          "Cada producto de nuestro catálogo indica en su propia ficha los alérgenos declarados (por ejemplo, gluten, frutos de cáscara o sésamo), según su receta.",
        ],
      },
      {
        heading: "Contaminación cruzada",
        paragraphs: [
          "Todo el pan se elabora en el mismo obrador, con equipos y superficies compartidas. Aunque un producto no incluya un alérgeno concreto entre sus ingredientes, no podemos garantizar la ausencia total de trazas si tienes una alergia o intolerancia grave.",
        ],
      },
      {
        heading: "Información por producto",
        paragraphs: [
          "Revisa la ficha de cada producto antes de reservar: ahí encontrarás sus alérgenos declarados junto con la descripción y el precio.",
        ],
      },
      {
        heading: "Consultas antes de comprar",
        paragraphs: [
          `Si tienes una alergia o intolerancia y necesitas más detalle antes de reservar, escríbenos desde la página de Contacto o a ${CONTACT_EMAIL} y te confirmamos lo que necesites.`,
        ],
      },
    ]),
  },
} as const;

export type LegalSlug = keyof typeof legalPages;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}
