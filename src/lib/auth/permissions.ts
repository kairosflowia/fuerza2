import type { AppRole } from "@/lib/supabase/database.types";

export const adminPermissions = {
  owner: ["*"],
  admin: ["produccion", "pedidos", "productos", "disponibilidad", "puntos-de-recogida", "clientes", "pagos", "suscripciones", "contenido", "comunicaciones", "analitica/productos", "auditoria"],
  operator: ["produccion", "pedidos", "puntos-de-recogida", "disponibilidad"],
  pickup_manager: [],
  customer: [],
} as const satisfies Record<AppRole, readonly string[]>;

export function canAccessAdmin(roles: readonly AppRole[]) {
  return roles.some((role) => adminPermissions[role].length > 0);
}

export function canAccessAdminSection(roles: readonly AppRole[], section: string) {
  return roles.some((role) => {
    const permissions = adminPermissions[role] as readonly string[];
    return permissions.includes("*") || permissions.includes(section);
  });
}

export function visibleAdminSections<T extends { slug: string }>(roles: readonly AppRole[], sections: readonly T[]) {
  return sections.filter(({ slug }) => canAccessAdminSection(roles, slug));
}

export function canManageRole(actorRoles: readonly AppRole[], targetRole: AppRole) {
  return actorRoles.includes("owner") && targetRole !== "customer";
}

/**
 * Gestión estructural (puntos de recogida, horarios, ventanas, capacidad,
 * excepciones, cierres, productos aceptados): solo owner/admin. El operador
 * tiene acceso a la sección "puntos-de-recogida" para consulta (producción y
 * distribución), pero nunca para escritura estructural — RLS aplica la misma
 * restricción como defensa en profundidad.
 */
export function canManagePickupOperations(roles: readonly AppRole[]) {
  return roles.includes("owner") || roles.includes("admin");
}

/**
 * Gestión estructural de disponibilidad (capacidad, apertura/cierre,
 * reserva para suscripciones, overrides): solo owner/admin. El operador
 * puede consultar todo y, mediante set_production_date_status, abrir o
 * cerrar una fecha ya creada — nunca cancelarla ni tocar capacidad. RLS
 * aplica la misma restricción como defensa en profundidad.
 */
export function canManageAvailability(roles: readonly AppRole[]) {
  return roles.includes("owner") || roles.includes("admin");
}
