"use client";

import { Button } from "@/components/ui/button";
import { Container, PageHeader, Section } from "@/components/ui/layout";

export default function OfflinePage() {
  return (
    <main id="main-content">
      <Section>
        <Container>
          <PageHeader eyebrow="Sin conexión" title="Ahora mismo no tienes conexión." description="El contenido básico que ya hayas visitado puede seguir disponible. La disponibilidad, los pedidos y los pagos necesitan conexión para ser seguros y estar actualizados." />
          <Button onClick={() => window.location.reload()}>Volver a intentarlo</Button>
        </Container>
      </Section>
    </main>
  );
}
