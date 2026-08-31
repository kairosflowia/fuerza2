"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactElement, type SVGProps } from "react";

import { adminNavigation, adminNavigationGroups, type AdminNavIcon } from "@/lib/navigation";
import { visibleAdminSections } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/supabase/database.types";
import {
  BoxesIcon,
  CalendarIcon,
  CardIcon,
  ChartIcon,
  ClipboardIcon,
  ClockIcon,
  DocumentIcon,
  GearIcon,
  MailIcon,
  OvenIcon,
  PackageIcon,
  PinIcon,
  RepeatIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";

import { Button } from "../ui/button";
import { Drawer } from "../ui/dialog";

// Secciones reservadas para una fase posterior: la ruta y los permisos ya
// existen, pero todavía no muestran datos reales, así que no deben aparecer
// en la navegación de producción.
const SECTIONS_NOT_READY = new Set(["usuarios", "auditoria"]);

const NAV_ICONS: Record<AdminNavIcon, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  oven: OvenIcon,
  clipboard: ClipboardIcon,
  package: PackageIcon,
  boxes: BoxesIcon,
  calendar: CalendarIcon,
  pin: PinIcon,
  user: UserIcon,
  card: CardIcon,
  repeat: RepeatIcon,
  chart: ChartIcon,
  document: DocumentIcon,
  mail: MailIcon,
  users: UsersIcon,
  gear: GearIcon,
  shield: ShieldIcon,
};

function AdminLinks({ roles, onNavigate }: { roles: readonly AppRole[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = visibleAdminSections(roles, adminNavigation).filter((item) => !SECTIONS_NOT_READY.has(item.slug));

  return (
    <nav className="admin-nav" aria-label="Administración">
      <div className="admin-nav__group">
        <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} onClick={onNavigate}>
          <ClockIcon />
          <span>Hoy</span>
        </Link>
      </div>
      {adminNavigationGroups.map((group) => {
        const items = sections.filter((item) => item.group === group.key);
        if (!items.length) return null;
        return (
          <div className="admin-nav__group" key={group.key}>
            <p className="admin-nav__heading">{group.label}</p>
            {items.map((item) => {
              const href = `/admin/${item.slug}`;
              const Icon = NAV_ICONS[item.icon];
              return (
                <Link
                  href={href}
                  key={item.slug}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ roles }: { roles: readonly AppRole[] }) {
  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">FUERZA <span>obrador</span></Link>
      <AdminLinks roles={roles} />
      <Link className="admin-back-link" href="/">Volver al portal</Link>
    </aside>
  );
}

export function AdminMobileNavigation({ roles }: { roles: readonly AppRole[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const primaryItems = visibleAdminSections(roles, adminNavigation)
    .filter((item) => !SECTIONS_NOT_READY.has(item.slug))
    .slice(0, 2);

  return (
    <>
      <nav className="admin-mobile-bar" aria-label="Accesos administrativos rápidos">
        <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined}>Hoy</Link>
        {primaryItems.map((item) => {
          const href = `/admin/${item.slug}`;
          return (
            <Link href={href} key={item.slug} aria-current={pathname === href ? "page" : undefined}>
              {item.shortLabel}
            </Link>
          );
        })}
        <Button
          ref={triggerRef}
          variant="text"
          aria-label="Abrir toda la navegación administrativa"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Más
        </Button>
      </nav>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Administración"
        returnFocusRef={triggerRef}
        className="admin-mobile-drawer"
      >
        <AdminLinks roles={roles} onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
