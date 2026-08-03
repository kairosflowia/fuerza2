import type { ReactNode } from "react";

import { Alert } from "../ui/alert";
import { AdminMobileNavigation, AdminSidebar } from "./admin-navigation";

export function AdminHeader() {
  return (
    <header className="admin-header">
      <div>
        <span className="admin-header__mark">FUERZA</span>
        <span className="admin-header__context">Administración</span>
      </div>
      <span className="badge badge--neutral">Estructura inicial</span>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-workspace">
        <AdminHeader />
        {process.env.NODE_ENV === "development" ? (
          <Alert variant="warning" title="Acceso todavía sin proteger" className="admin-dev-alert">
            La autenticación y los permisos se implementarán en su fase correspondiente. No uses esta estructura con datos reales.
          </Alert>
        ) : null}
        <main id="main-content" className="admin-main">{children}</main>
      </div>
      <AdminMobileNavigation />
    </div>
  );
}
