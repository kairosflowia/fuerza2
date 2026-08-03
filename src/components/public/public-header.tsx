"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { publicNavigation } from "@/lib/navigation";

import { Button } from "../ui/button";
import { Drawer } from "../ui/dialog";
import { MenuIcon } from "../ui/icons";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="public-header">
      <div className="container container--wide public-header__inner">
        <Link className="wordmark" href="/" aria-label="FUERZA, inicio">
          FUERZA
        </Link>

        <nav className="public-nav" aria-label="Navegación principal">
          {publicNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-header__actions">
          <Link className="button button--primary header-cta" href="/reserva">
            Reserva y recoge
          </Link>
          <Button
            ref={triggerRef}
            variant="icon"
            className="mobile-menu-trigger"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </Button>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Menú"
        returnFocusRef={triggerRef}
        className="mobile-navigation"
      >
        <nav id="public-mobile-menu" aria-label="Navegación móvil">
          {publicNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </header>
  );
}
