export const publicNavigation = [
  { label: "Inicio", href: "/" },
  { label: "Pan", href: "/pan" },
  { label: "Reserva y recoge", href: "/reserva-y-recoge" },
  { label: "Fuerza Habitual", href: "/plan-de-pan" },
  { label: "Dónde estamos", href: "/donde-estamos" },
  { label: "Contacto", href: "/contacto" },
] as const;

export const publicRoutes = [
  "/",
  "/obrador",
  "/nosotros",
  "/plan-de-pan",
  "/plan-de-pan/membresias",
  "/donde-estamos",
  "/reserva-y-recoge",
  "/contacto",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones-de-compra",
  "/politica-de-cancelacion",
  "/politica-de-suscripcion",
  "/informacion-alergenos",
  "/offline",
] as const;

export const accountRoutes = [
  "/cuenta",
  "/cuenta/acceder",
  "/cuenta/crear",
  "/cuenta/recuperar",
  "/cuenta/restablecer",
  "/cuenta/acceso-denegado",
  "/auth/callback",
] as const;

export const adminNavigationGroups = [
  { key: "operacion", label: "Operación" },
  { key: "catalogo", label: "Catálogo" },
  { key: "clientes", label: "Clientes" },
  { key: "negocio", label: "Negocio" },
  { key: "configuracion", label: "Configuración" },
] as const;

export const adminNavigation = [
  { slug: "produccion", label: "Producción", shortLabel: "Producción", description: "Organiza el trabajo del obrador por fecha y punto.", group: "operacion", icon: "oven" },
  { slug: "disponibilidad", label: "Disponibilidad", shortLabel: "Disponible", description: "Configura capacidad, días de producción y disponibilidad.", group: "operacion", icon: "calendar" },
  { slug: "pedidos", label: "Pedidos", shortLabel: "Pedidos", description: "Consulta y prepara los pedidos confirmados.", group: "operacion", icon: "clipboard" },
  { slug: "puntos-de-recogida", label: "Recogidas", shortLabel: "Recogidas", description: "Puntos, horarios, calendario de cierres y excepciones: un mismo sistema de recogida.", group: "operacion", icon: "pin" },
  { slug: "inventario", label: "Inventario", shortLabel: "Estoque", description: "Registra entradas, mermas y ajustes de estoque por variante.", group: "operacion", icon: "boxes" },
  { slug: "productos", label: "Productos", shortLabel: "Productos", description: "Gestiona productos, familias, variantes e información asociada.", group: "catalogo", icon: "package" },
  { slug: "clientes", label: "Clientes", shortLabel: "Clientes", description: "Consulta la información necesaria para atender a clientes.", group: "clientes", icon: "user" },
  { slug: "analitica", label: "Analítica", shortLabel: "Métricas", description: "Consulta ventas, producción, clientes, planes y puntos.", group: "negocio", icon: "chart" },
  { slug: "pagos", label: "Pagos", shortLabel: "Pagos", description: "Revisa pagos, incidencias y reembolsos.", group: "negocio", icon: "card" },
  { slug: "suscripciones", label: "Suscripciones", shortLabel: "Planes", description: "Gestiona el Plan de Pan y sus entregas.", group: "negocio", icon: "repeat" },
  { slug: "mensajes", label: "Mensajes", shortLabel: "Mensajes", description: "Consultas recibidas desde el formulario de contacto.", group: "negocio", icon: "mail" },
  { slug: "comunicaciones", label: "Comunicaciones", shortLabel: "Avisos", description: "Consulta la cola, entregas y fallos transaccionales.", group: "negocio", icon: "mail" },
  { slug: "contenido", label: "Contenido", shortLabel: "Contenido", description: "Mantén los textos e imágenes institucionales permitidos.", group: "configuracion", icon: "document" },
  { slug: "usuarios", label: "Usuarios", shortLabel: "Usuarios", description: "Gestiona usuarios y permisos del equipo.", group: "configuracion", icon: "users" },
  { slug: "configuracion", label: "Configuración", shortLabel: "Ajustes", description: "Ajusta las reglas generales y datos del portal.", group: "configuracion", icon: "gear" },
  { slug: "auditoria", label: "Auditoría", shortLabel: "Auditoría", description: "Consulta el historial de acciones relevantes.", group: "configuracion", icon: "shield" },
] as const;

export type AdminSection = (typeof adminNavigation)[number];
export type AdminNavIcon = AdminSection["icon"];

export function getAdminSection(slug: string): AdminSection | undefined {
  return adminNavigation.find((item) => item.slug === slug);
}
