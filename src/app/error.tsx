"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="status-page">
      <Container>
        <p className="eyebrow">Algo no ha salido bien</p>
        <h1>No hemos podido cargar esta página</h1>
        <p>Vuelve a intentarlo. Si el problema continúa, regresa al inicio.</p>
        <p><small>Referencia para soporte: {error.digest ?? "error-de-carga"}</small></p>
        <Button onClick={reset}>Volver a intentarlo</Button>
      </Container>
    </main>
  );
}
