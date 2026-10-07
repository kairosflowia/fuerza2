"use client";

import { PublicHeader } from "@/components/public/public-header";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="fz">
      <PublicHeader />
      <main id="main-content" className="fz-container fz-status">
        <p className="fz-eyebrow">Algo no ha salido bien</p>
        <h1 className="fz-display">No hemos podido cargar esta página</h1>
        <p>Vuelve a intentarlo. Si el problema continúa, regresa al inicio.</p>
        <p className="fz-status__ref">Referencia para soporte: {error.digest ?? "error-de-carga"}</p>
        <button type="button" className="fz-btn" onClick={reset}>Volver a intentarlo</button>
      </main>
    </div>
  );
}
