import type { AppRole } from "@/lib/supabase/database.types";

export const adminPermissions = {
  owner: ["*"],
  admin: ["produccion", "pedidos", "productos", "disponibilidad", "puntos-de-recogida", "clientes", "pagos", "suscripciones", "contenido", "auditoria"],
  operator: ["produccion", "pedidos", "puntos-de-recogida"],
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
