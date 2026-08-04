export const publicNavigation = [
  { label: "Catálogo", href: "/pan" },
  { label: "Dónde estamos", href: "/donde-estamos" },
  { label: "Reserva y recoge", href: "/reserva-y-recoge" },
] as const;

export const publicRoutes = [
  "/",
  "/pan",
  "/obrador",
  "/nosotros",
  "/plan-de-pan",
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
  { key: "operaciones", label: "Operaciones" },
  { key: "ventas", label: "Ventas & clientes" },
  { key: "sistema", label: "Sistema" },
] as const;

export const adminNavigation = [
  { slug: "produccion", label: "Producción", shortLabel: "Producción", description: "Organiza el trabajo del obrador por fecha y punto.", group: "operaciones", icon: "oven" },
  { slug: "pedidos", label: "Pedidos", shortLabel: "Pedidos", description: "Consulta y prepara los pedidos confirmados.", group: "operaciones", icon: "clipboard" },
  { slug: "productos", label: "Productos", shortLabel: "Productos", description: "Gestiona productos, familias, variantes e información asociada.", group: "operaciones", icon: "package" },
  { slug: "disponibilidad", label: "Disponibilidad", shortLabel: "Disponible", description: "Configura capacidad, días de producción y disponibilidad.", group: "operaciones", icon: "calendar" },
  { slug: "puntos-de-recogida", label: "Puntos de recogida", shortLabel: "Puntos", description: "Gestiona puntos, horarios, cierres y reglas de recogida.", group: "operaciones", icon: "pin" },
  { slug: "clientes", label: "Clientes", shortLabel: "Clientes", description: "Consulta la información necesaria para atender a clientes.", group: "ventas", icon: "user" },
  { slug: "pagos", label: "Pagos", shortLabel: "Pagos", description: "Revisa pagos, incidencias y reembolsos.", group: "ventas", icon: "card" },
  { slug: "suscripciones", label: "Suscripciones", shortLabel: "Planes", description: "Gestiona el futuro Plan de Pan y sus entregas.", group: "ventas", icon: "repeat" },
  { slug: "analitica/productos", label: "Analítica", shortLabel: "Métricas", description: "Consulta ventas, producción, clientes, planes y puntos.", group: "ventas", icon: "chart" },
  { slug: "contenido", label: "Contenido", shortLabel: "Contenido", description: "Mantén los textos e imágenes institucionales permitidos.", group: "sistema", icon: "document" },
  { slug: "comunicaciones", label: "Comunicaciones", shortLabel: "Mensajes", description: "Consulta la cola, entregas y fallos transaccionales.", group: "sistema", icon: "mail" },
  { slug: "usuarios", label: "Usuarios", shortLabel: "Usuarios", description: "Gestiona usuarios y permisos del equipo.", group: "sistema", icon: "users" },
  { slug: "configuracion", label: "Configuración", shortLabel: "Ajustes", description: "Ajusta las reglas generales y datos del portal.", group: "sistema", icon: "gear" },
  { slug: "auditoria", label: "Auditoría", shortLabel: "Auditoría", description: "Consulta el historial de acciones relevantes.", group: "sistema", icon: "shield" },
] as const;

export type AdminSection = (typeof adminNavigation)[number];
export type AdminNavIcon = AdminSection["icon"];

export function getAdminSection(slug: string): AdminSection | undefined {
  return adminNavigation.find((item) => item.slug === slug);
}
