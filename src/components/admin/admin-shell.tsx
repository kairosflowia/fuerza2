import type { ReactNode } from "react";

import { signOutAction } from "@/app/(public)/cuenta/actions";
import type { AppRole } from "@/lib/supabase/database.types";

import { Button } from "../ui/button";
import { ToastProvider } from "../ui/toast";
import { AdminMobileNavigation, AdminSidebar } from "./admin-navigation";

const ROLE_LABEL_ES: Record<AppRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  operator: "Operador",
  pickup_manager: "Punto de recogida",
  customer: "Cliente",
};

function primaryRoleLabel(roles: readonly AppRole[]) {
  const priority: AppRole[] = ["owner", "admin", "operator", "pickup_manager", "customer"];
  const role = priority.find((candidate) => roles.includes(candidate));
  return role ? ROLE_LABEL_ES[role] : "Equipo";
}

export function AdminHeader({ email, fullName, roles }: { email: string; fullName: string | null; roles: readonly AppRole[] }) {
  const displayName = fullName?.trim() || email;
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <header className="admin-header">
      <div>
        <span className="admin-header__mark">FUERZA</span>
        <span className="admin-header__context">Administración</span>
      </div>
      <div className="admin-user">
        <span className="admin-user__info">
          <span className="admin-user__name">{displayName}</span>
          <span className="admin-user__role">{primaryRoleLabel(roles)}</span>
        </span>
        <span className="admin-user__avatar">{initial}</span>
        <form action={signOutAction}><Button variant="text" type="submit">Cerrar sesión</Button></form>
      </div>
    </header>
  );
}

export function AdminShell({ children, email, fullName, roles }: { children: ReactNode; email: string; fullName: string | null; roles: readonly AppRole[] }) {
  return (
    <ToastProvider>
      <div className="admin-shell">
        <AdminSidebar roles={roles} />
        <div className="admin-workspace">
          <AdminHeader email={email} fullName={fullName} roles={roles} />
          <main id="main-content" className="admin-main">{children}</main>
        </div>
        <AdminMobileNavigation roles={roles} />
      </div>
    </ToastProvider>
  );
}
