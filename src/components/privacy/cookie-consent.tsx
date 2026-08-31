"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
const VERSION = "2026-08";
type Consent = { necessary: true; version: string };
function save(value: Consent) {
  localStorage.setItem("fuerza-cookie-consent", JSON.stringify(value));
  document.cookie = `fuerza_cookie_consent=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("fuerza-cookie-consent") ?? "null");
      if (!stored || stored.version !== VERSION) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  return (
    <aside className="cookie-banner" aria-labelledby="cookie-title">
      <h2 id="cookie-title">Cookies</h2>
      <p>
        Usamos únicamente cookies necesarias para la sesión, la cesta y la seguridad del sitio. No usamos cookies de analítica ni de publicidad.{" "}
        <Link href="/cookies">Más información</Link>.
      </p>
      <div>
        <Button
          onClick={() => {
            save({ necessary: true, version: VERSION });
            setOpen(false);
          }}
        >
          Entendido
        </Button>
      </div>
    </aside>
  );
}
