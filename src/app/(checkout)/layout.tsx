import type { ReactNode } from "react";

import { CheckoutTopBar } from "@/components/catalog/checkout-top-bar";
import { PwaRegister } from "@/components/pwa/pwa-register";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <div className="checkout-shell">
        <div className="catalog-header">
          <CheckoutTopBar />
        </div>
        {children}
      </div>
      <PwaRegister />
    </>
  );
}
