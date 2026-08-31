import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EditorialGrid, ValueCard } from "@/components/public/editorial";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Quiénes somos — obrador en Asturias",
  description: "Somos un obrador pequeño de masa madre en Avilés, Asturias. Trabajamos con harinas locales y con la gente que tenemos cerca.",
  path: "/nosotros",
  ogTitle: "Somos un obrador pequeño",
  ogDescription: "Masa madre en Asturias. Harina de aquí y las manos que hacen falta.",
});

export default function NosotrosPage() {
  return (
    <main id="main-content">
      <Section><Container size="wide">
        <PageIntro title="Nosotros" eyebrow="Las personas" description="Somos un obrador pequeño de masa madre en Avilés, Asturias." />
        <div className="people-section people-section--intro">
          <div><h2>Quién lo hace</h2><p>Cada hogaza pasa por unas manos concretas. Añadiremos nombres, tareas, fotografías y la historia del obrador cuando ese material esté aprobado.</p><p>No vamos a completar esos huecos con personajes inventados.</p></div>
          <Image src="/ilustraciones-strip.png" alt="Ilustraciones de personas, panes y espigas que forman la identidad de FUERZA." width={284} height={100} priority sizes="(max-width: 767px) 100vw, 42vw" />
        </div>
      </Container></Section>
      <Section tone="sunken"><Container size="wide" className="split-section">
        <div><p className="eyebrow">Asturias</p><h2>Por qué aquí</h2></div>
        <div><p>Asturias tiene cereal, molinos y gente que sabe de esto. Estamos en Avilés y queremos mantener cerca el origen de lo que usamos.</p><p>Los nombres de productores y molinos se publicarán solo cuando estén confirmados.</p></div>
      </Container></Section>
      <Section><Container size="wide">
        <h2 className="section-title">El pan no se levanta solo</h2>
        <p className="section-lead">Hay quien cultiva el cereal, quien lo muele, quien amasa y quien espera al otro lado del mostrador. Nosotros estamos en medio.</p>
        <EditorialGrid columns={4}>
          <ValueCard title="Tradición que se siente" tone="terracotta">Hacemos lo que sabemos que funciona, sin usar la nostalgia como argumento.</ValueCard>
          <ValueCard title="Ingredientes que cuentan" tone="yellow">Cada ingrediente tiene una tarea y una procedencia que debe poder explicarse.</ValueCard>
          <ValueCard title="Tiempo que transforma" tone="green">La masa marca el ritmo. No fingimos que ese tiempo se puede acelerar.</ValueCard>
          <ValueCard title="Comunidad que nos inspira" tone="blue">Un obrador pequeño existe por la gente que trabaja y vuelve cerca.</ValueCard>
        </EditorialGrid>
      </Container></Section>
      <Section tone="inverse"><Container size="wide" className="cta-band"><div><p className="eyebrow">Pequeño obrador</p><h2>Somos un obrador pequeño, pero con mucha fuerza.</h2><p>No queremos hacer más de lo que podemos hacer bien.</p></div><div className="hero-actions"><Link className="button button--primary" href="/reserva-y-recoge">Ver el pan</Link><Link className="button button--secondary button--inverse" href="/donde-estamos">Dónde estamos</Link></div></Container></Section>
    </main>
  );
}
