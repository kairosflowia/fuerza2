import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EditorialGrid, EditorialProductCard, SectionHeading, TextLink, ValueCard } from "@/components/public/editorial";
import { Newsletter } from "@/components/public/newsletter";
import { Badge, Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Pan de masa madre en Asturias",
  description: "Obrador de masa madre en Asturias. Harinas locales, fermentación lenta y cantidad limitada cada día. Reserva tu pan y recógelo cuando te venga bien.",
  path: "/",
  ogTitle: "FUERZA — Obrador de masa madre en Asturias",
  ogDescription: "Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta.",
});

const processSteps = [
  ["01", "Masa madre", "Cada día le damos harina y agua. Sin eso, no hay pan al día siguiente."],
  ["02", "Amasado", "Harina, agua y sal. La masa se trabaja poco y descansa mucho."],
  ["03", "Reposo", "Aquí no pasa nada visible y pasa todo. El sabor necesita tiempo."],
  ["04", "Horno", "Formamos cada pieza a mano. El horno termina lo que empezó el tiempo."],
  ["05", "Recogida", "Sale del horno y va al punto donde lo hayas reservado."],
] as const;

export default function Home() {
  return (
    <main id="main-content">
      <section className="home-hero">
        <Container size="wide" className="home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">El pan no se levanta solo</p>
            <h1>Pan de masa madre, hecho entre dos manos y el tiempo.</h1>
            <p className="home-hero__lead">Somos un obrador pequeño en Asturias. Harina de aquí, fermentación lenta y la cantidad que podemos hacer bien.</p>
            <div className="hero-actions">
              <Link className="button button--primary" href="/reserva-y-recoge">Reserva y recoge</Link>
              <Link className="button button--secondary" href="/obrador">Conoce el obrador</Link>
            </div>
            <p className="hero-note">Reservas, lo horneamos y lo recoges. Pagas al reservar.</p>
          </div>
          <figure className="home-hero__visual">
            <Image src="/fuerza.jpeg" alt="Dos personas levantan juntas una hogaza de pan más grande que ellas." width={1254} height={1254} priority sizes="(max-width: 767px) 100vw, 48vw" />
          </figure>
        </Container>
      </section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="Lo que sale del horno" title="El catálogo empieza aquí" description="Cada día haremos una cantidad limitada. Hasta que los productos estén aprobados, estos bloques solo validan la composición editorial." />
          <EditorialGrid>{[1, 2, 3].map((index) => <EditorialProductCard index={index} key={index} />)}</EditorialGrid>
          <TextLink href="/pan">Ver la estructura del pan</TextLink>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading eyebrow="El tiempo que transforma" title="Lo que ocurre antes de abrir el horno" description="No damos horas exactas hasta tener los tiempos reales del obrador. El orden del trabajo sí está claro." />
          <ol className="process-list">
            {processSteps.map(([number, title, text]) => (
              <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></li>
            ))}
          </ol>
          <TextLink href="/obrador">Ver cómo trabajamos</TextLink>
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="Lo que nos mueve" title="Cuatro cosas que no negociamos" />
          <EditorialGrid columns={4}>
            <ValueCard title="Tradición que se siente" tone="terracotta">Hacemos pan como se hacía antes de que hubiera prisa. No por nostalgia: porque sale mejor.</ValueCard>
            <ValueCard title="Ingredientes que cuentan" tone="yellow">Harina, agua, sal y masa madre. Si un ingrediente no hace falta, no está.</ValueCard>
            <ValueCard title="Tiempo que transforma" tone="green">La fermentación lenta no se puede acelerar. Es la parte del trabajo que hace el reloj.</ValueCard>
            <ValueCard title="Comunidad que nos inspira" tone="blue">Un obrador pequeño vive de la gente que vuelve y de quienes trabajan cerca.</ValueCard>
          </EditorialGrid>
        </Container>
      </Section>

      <Section tone="inverse" className="origin-section">
        <Container size="wide" className="split-section">
          <div><p className="eyebrow">Asturias</p><h2>Harina de aquí</h2></div>
          <div><p>Asturias tiene cereal, molinos y gente que sabe de esto. La producción local mantiene el pan cerca de su origen y del lugar donde se comparte.</p><p>Publicaremos cada procedencia cuando estén confirmados los datos de productores e ingredientes.</p></div>
        </Container>
      </Section>

      <Section>
        <Container size="wide" className="plan-preview">
          <div>
            <Badge variant="information">Próximamente</Badge>
            <p className="eyebrow">Plan de Pan</p>
            <h2>Tu pan, sin tener que acordarte</h2>
            <p>Estamos preparando una forma de reservar pan con continuidad, con prioridad de stock y control para pausar, retomar o cancelar.</p>
            <TextLink href="/plan-de-pan">Conocer el futuro Plan de Pan</TextLink>
          </div>
          <div className="plan-preview__stamp" aria-hidden="true">PAN<br />CADA<br />SEMANA</div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading eyebrow="Reserva y recoge" title="Tres pasos y ya está" />
          <EditorialGrid>
            <ValueCard number="01" title="Elige tu pan">Verás qué productos hay y para qué días se hornean.</ValueCard>
            <ValueCard number="02" title="Elige cuándo y dónde recogerlo">Cada punto tendrá sus propios días, horarios y capacidad.</ValueCard>
            <ValueCard number="03" title="Paga y recógelo">El pedido se confirma tras el pago. En el punto no se paga nada.</ValueCard>
          </EditorialGrid>
          <Link className="button button--primary" href="/reserva-y-recoge">Cómo funcionará</Link>
        </Container>
      </Section>

      <Section>
        <Container size="wide" className="people-section">
          <div>
            <p className="eyebrow">El obrador</p>
            <h2>Somos pocos, y eso se nota</h2>
            <p>Detrás de cada hogaza hay manos concretas. Añadiremos nombres, retratos y tareas cuando ese contenido esté aprobado.</p>
            <TextLink href="/nosotros">Conocer quiénes somos</TextLink>
          </div>
          <Image src="/fuerza_info.jpeg" alt="Hoja de identidad visual de FUERZA con ilustraciones del obrador." width={1183} height={1330} sizes="(max-width: 767px) 100vw, 42vw" />
        </Container>
      </Section>

      <Section tone="sunken"><Container size="wide"><Newsletter /></Container></Section>
    </main>
  );
}
