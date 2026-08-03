import type { ReactNode } from "react";

import { signOutAction } from "@/app/(public)/cuenta/actions";
import type { AppRole } from "@/lib/supabase/database.types";

import { Button } from "../ui/button";
import { AdminMobileNavigation, AdminSidebar } from "./admin-navigation";

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="admin-header">
      <div>
        <span className="admin-header__mark">FUERZA</span>
        <span className="admin-header__context">Administración</span>
      </div>
      <div className="admin-user">
        <span>{email}</span>
        <form action={signOutAction}><Button variant="text" type="submit">Cerrar sesión</Button></form>
      </div>
    </header>
  );
}

export function AdminShell({ children, email, roles }: { children: ReactNode; email: string; roles: readonly AppRole[] }) {
  return (
    <div className="admin-shell">
      <AdminSidebar roles={roles} />
      <div className="admin-workspace">
        <AdminHeader email={email} />
        <main id="main-content" className="admin-main">{children}</main>
      </div>
      <AdminMobileNavigation roles={roles} />
    </div>
  );
}
