"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { footerNavigation, publicNavigation } from "@/lib/navigation";

import { Drawer } from "../ui/dialog";
import { MenuIcon, UserIcon } from "../ui/icons";
import { CartLink } from "../cart/cart-link";
import { MiniCart } from "../cart/mini-cart";

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="fz-header">
      <div className="fz-container fz-header__inner">
        <button
          ref={triggerRef}
          type="button"
          className="fz-icon-btn fz-header__menu"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </button>

        <nav className="fz-header__nav" aria-label="Navegación principal">
          {publicNavigation.map((item) => (
            <Link href={item.href} key={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="fz-header__logo" href="/" aria-label="FUERZA, obrador de masa madre. Inicio">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG vectorial de marca: no necesita optimización de next/image. */}
          <img src="/illustrations/fuerza-stacked.svg" alt="" width={163} height={80} />
        </Link>

        <div className="fz-header__actions">
          <Link href="/cuenta" className="fz-icon-btn fz-header__account" aria-label="Mi cuenta">
            <UserIcon />
          </Link>
          <div className="cart-widget">
            <CartLink />
            <MiniCart />
          </div>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Menú"
        returnFocusRef={triggerRef}
        className="dialog--left fz-mobile-nav"
      >
        <nav id="public-mobile-menu" aria-label="Navegación móvil">
          {[...footerNavigation, { label: "Mi cuenta", href: "/cuenta" }].map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
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
