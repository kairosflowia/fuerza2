import type { Metadata } from "next";
import Link from "next/link";

import { EditorialGrid, ValueCard } from "@/components/public/editorial";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cómo hacemos el pan",
  description: "Masa madre viva, fermentación lenta y una cantidad limitada cada día. Así trabajamos en nuestro obrador de Asturias.",
  path: "/obrador",
  ogTitle: "El obrador de FUERZA",
  ogDescription: "Masa madre, tiempo y una cantidad limitada. Así se hace este pan.",
});

export default function ObradorPage() {
  return (
    <main id="main-content">
      <Section><Container size="wide">
        <PageIntro title="El obrador" eyebrow="Cómo trabajamos" description="Aquí se hace el pan. Somos pocos, el sitio es pequeño y el horno tiene un límite. Todo lo que sigue sale de ahí." />
      </Container></Section>
      <Section tone="sunken"><Container size="wide">
        <EditorialGrid columns={2}>
          <ValueCard number="01" title="La masa madre">Harina y agua que fermentan y que alimentamos cada día. No usamos levadura industrial.</ValueCard>
          <ValueCard number="02" title="La fermentación">Después de amasar, esperamos. Publicaremos el tiempo exacto cuando esté confirmado por el obrador.</ValueCard>
          <ValueCard number="03" title="El horno">Formamos cada pieza a mano. Cuando sale, el pan sigue trabajando por dentro mientras se enfría.</ValueCard>
          <ValueCard number="04" title="La rutina">Se amasa, se espera, se forma, se hornea y se reparte. El horario general es de 9:00 a 18:00.</ValueCard>
        </EditorialGrid>
      </Container></Section>
      <Section><Container size="wide" className="prose-layout">
        <article><h2>Por qué hay una cantidad limitada</h2><p>No es una estrategia. Es que tenemos un horno, unas manos y unas horas.</p><p>Cada día podemos hacer una cantidad concreta. Hacer de más por si acaso acaba en pan tirado. Reservar nos permitirá hornear exactamente el pan que hace falta.</p></article>
        <article><h2>Lo que no se tira</h2><p>El pan no dura para siempre, y eso es normal en un pan sin conservantes. Lo que no queremos es tirarlo.</p><p>La producción limitada y el pago al reservar harán que cada pieza tenga destino antes de encender el horno.</p></article>
      </Container></Section>
      <Section tone="inverse"><Container size="wide" className="cta-band"><div><p className="eyebrow">Hecho con tiempo y fuerza</p><h2>El pan empieza antes de que abra la puerta.</h2></div><Link className="button button--primary" href="/reserva-y-recoge">Ver la estructura del pan</Link></Container></Section>
    </main>
  );
}
