import Link from "next/link";

import { Container } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <main id="main-content" className="status-page">
      <Container>
        <p className="eyebrow">Error 404</p>
        <h1>Esta página no está en el horno</h1>
        <p>Puede que la dirección haya cambiado o que el contenido todavía no exista.</p>
        <Link className="button button--primary" href="/">Volver al inicio</Link>
      </Container>
    </main>
  );
}
