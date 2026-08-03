import type { Metadata } from "next";
import Link from "next/link";

import { EditorialGrid, EditorialProductCard } from "@/components/public/editorial";
import { PageIntro } from "@/components/public/page-intro";
import { Badge, Button, Container, EmptyState, Section, Select } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "El pan que horneamos",
  description: "Panes de masa madre con harinas locales y fermentación lenta. La estructura del catálogo de FUERZA, a la espera de los productos aprobados.",
  path: "/pan",
  ogTitle: "El pan de FUERZA",
  ogDescription: "Masa madre, harina local y fermentación lenta. Reserva y recoge en Asturias.",
});

export default function PanPage() {
  return (
    <main id="main-content">
      <Section><Container size="wide">
        <PageIntro title="El pan" eyebrow="Catálogo editorial" description="Esto será todo lo que hacemos. No todo se horneará todos los días: la disponibilidad real llegará con el catálogo y el calendario." />
        <div className="catalog-toolbar" aria-label="Filtros todavía no disponibles">
          <Select id="catalog-family" label="Familias" disabled><option>Todas las familias</option></Select>
          <Select id="catalog-day" label="Día de recogida" disabled><option>Fechas disponibles al publicar</option></Select>
          <p><Badge variant="warning">Filtros inactivos</Badge> Se activarán cuando existan productos y fechas reales.</p>
        </div>
      </Container></Section>

      <Section tone="sunken"><Container size="wide">
        <h2 className="catalog-heading">Estructura del catálogo</h2>
        <EditorialGrid>{[1, 2, 3].map((index) => <EditorialProductCard index={index} key={index} />)}</EditorialGrid>
        <div className="catalog-empty-preview">
          <EmptyState title="Todavía no hay productos publicados." description="El catálogo se completará con productos, familias, ingredientes y alérgenos aprobados por el obrador." />
        </div>
        <p className="catalog-note">Estos bloques no representan panes, precios ni disponibilidad reales.</p>
        <Button disabled>Reservar</Button>
        <p className="form-status">La reserva se activará cuando el catálogo y la disponibilidad sean reales.</p>
        <Link className="text-link" href="/reserva-y-recoge">Entender cómo funcionará la reserva</Link>
      </Container></Section>
    </main>
  );
}
