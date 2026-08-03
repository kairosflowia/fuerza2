export const publicNavigation = [
  { label: "Pan", href: "/pan" },
  { label: "Obrador", href: "/obrador" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Plan de Pan", href: "/suscripciones" },
  { label: "Dónde estamos", href: "/donde-estamos" },
] as const;

export const adminNavigation = [
  { slug: "produccion", label: "Producción", shortLabel: "Producción", description: "Organiza el trabajo del obrador por fecha y punto." },
  { slug: "pedidos", label: "Pedidos", shortLabel: "Pedidos", description: "Consulta y prepara los pedidos confirmados." },
  { slug: "productos", label: "Productos", shortLabel: "Productos", description: "Gestiona productos, familias, variantes e información asociada." },
  { slug: "disponibilidad", label: "Disponibilidad", shortLabel: "Disponible", description: "Configura capacidad, días de producción y disponibilidad." },
  { slug: "puntos-de-recogida", label: "Puntos de recogida", shortLabel: "Puntos", description: "Gestiona puntos, horarios, cierres y reglas de recogida." },
  { slug: "clientes", label: "Clientes", shortLabel: "Clientes", description: "Consulta la información necesaria para atender a clientes." },
  { slug: "pagos", label: "Pagos", shortLabel: "Pagos", description: "Revisa pagos, incidencias y reembolsos." },
  { slug: "suscripciones", label: "Suscripciones", shortLabel: "Planes", description: "Gestiona el futuro Plan de Pan y sus entregas." },
  { slug: "contenido", label: "Contenido", shortLabel: "Contenido", description: "Mantén los textos e imágenes institucionales permitidos." },
  { slug: "usuarios", label: "Usuarios", shortLabel: "Usuarios", description: "Gestiona usuarios y permisos del equipo." },
  { slug: "configuracion", label: "Configuración", shortLabel: "Ajustes", description: "Ajusta las reglas generales y datos del portal." },
  { slug: "auditoria", label: "Auditoría", shortLabel: "Auditoría", description: "Consulta el historial de acciones relevantes." },
] as const;

export type AdminSection = (typeof adminNavigation)[number];

export function getAdminSection(slug: string): AdminSection | undefined {
  return adminNavigation.find((item) => item.slug === slug);
}
