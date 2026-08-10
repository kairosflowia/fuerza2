"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { publicNavigation } from "@/lib/navigation";

import { Button } from "../ui/button";
import { Drawer } from "../ui/dialog";
import { MenuIcon } from "../ui/icons";
import { CartLink } from "../cart/cart-link";
import { MiniCart } from "../cart/mini-cart";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="public-header">
      <div className="container container--wide public-header__inner">
        <Link className="site-logo" href="/" aria-label="FUERZA, inicio">
          <Image src="/logo_fuerza_principal.png" alt="FUERZA, obrador de masa madre" width={496} height={438} priority />
        </Link>

        <nav className="public-nav" aria-label="Navegación principal">
          {publicNavigation.slice(0, -1).map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-header__actions">
          <div className="cart-widget">
            <CartLink />
            <MiniCart />
          </div>
          <Link className="button button--primary header-cta" href="/reserva-y-recoge">
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
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
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
