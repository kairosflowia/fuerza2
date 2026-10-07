import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";

export function NotFoundContent() {
  return (
    <main id="main-content" className="fz-container fz-status">
      <p className="fz-eyebrow">Error 404</p>
      <h1 className="fz-display">Esta página no está en el horno</h1>
      <p>Puede que la dirección haya cambiado o que el contenido todavía no exista.</p>
      <Link className="fz-btn" href="/">
        Volver al inicio
        <ArrowRightIcon />
      </Link>
    </main>
  );
}
