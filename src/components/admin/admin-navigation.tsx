"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { adminNavigation } from "@/lib/navigation";

import { Button } from "../ui/button";
import { Drawer } from "../ui/dialog";

function AdminLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Administración">
      {adminNavigation.map((item) => {
        const href = `/admin/${item.slug}`;
        return (
          <Link
            href={href}
            key={item.slug}
            aria-current={pathname === href ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">FUERZA <span>obrador</span></Link>
      <AdminLinks />
      <Link className="admin-back-link" href="/">Volver al portal</Link>
    </aside>
  );
}

export function AdminMobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const primaryItems = adminNavigation.slice(0, 3);

  return (
    <>
      <nav className="admin-mobile-bar" aria-label="Accesos administrativos rápidos">
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
        <AdminLinks onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
