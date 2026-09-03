import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { Container, Section } from "@/components/ui";
import { ArchOvenIcon, ClockIcon, JarIcon, WheatIcon } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/seo";

const OBRADOR_STEPS = [
  { number: "01", title: "La masa madre", text: "Harina y agua que fermentan y que alimentamos cada día. Ni usamos levadura industrial.", icon: JarIcon },
  { number: "02", title: "La fermentación", text: "Después de amasar, esperamos. Paciencia es el tiempo exacto cuando está confirmado por el estado.", icon: ClockIcon },
  { number: "03", title: "El horno", text: "Formamos cada pieza a mano. Cuando sale, el pan sigue trabajando por dentro mientras se enfría.", icon: ArchOvenIcon },
  { number: "04", title: "La rutina", text: "Se amasa, se reposa, se forma, se hornea y se reparte.", icon: WheatIcon },
] as const;

export const metadata: Metadata = createPageMetadata({
  title: "Cómo hacemos el pan",
  description: "Masa madre viva, fermentación lenta y una cantidad limitada cada día. Así trabajamos en nuestro obrador de Asturias.",
  path: "/obrador",
  ogTitle: "El obrador de FUERZA",
  ogDescription: "Masa madre, tiempo y una cantidad limitada. Así se hace este pan.",
});

export default function ObradorPage() {
  return (
    <main id="main-content" className="home-theme obrador-page">
      {/* 1. Hero */}
      <section className="obrador-hero">
        <div className="obrador-hero__text">
          <Breadcrumbs items={[{ label: "El obrador" }]} />
          <p className="eyebrow">Cómo trabajamos</p>
          <h1>El obrador</h1>
          <p>Aquí se hace el pan. Somos pocos, el sitio es pequeño y el horno tiene un límite. Todo lo que sigue sale de ahí.</p>
        </div>
        <div className="obrador-hero__media">
          <Image
            src="/images/obrador/obrador-hero.webp"
            alt="Masa de pan reposando sobre la mesa de trabajo, con el horno de leña encendido y pan en las estanterías al fondo"
            fill
            sizes="(min-width: 64rem) 65vw, 100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
        </div>
      </section>

      {/* 2. Los 4 pasos del proceso */}
      <Section tone="sunken" className="obrador-steps-section">
        <Container size="wide" className="container--home">
          <div className="obrador-steps">
            {OBRADOR_STEPS.map(({ number, title, text, icon: Icon }) => (
              <article key={number} className="obrador-step">
                <div className="obrador-step__body">
                  <span className="obrador-step__number">{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <span className="obrador-step__icon" aria-hidden="true"><Icon width={46} height={46} /></span>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3. Por qué hay una cantidad limitada */}
      <section className="obrador-editorial">
        <div className="obrador-editorial__text">
          <h2>Por qué hay una cantidad limitada</h2>
          <p>No es una estrategia. Es que tenemos un horno, unas manos y unas horas. Cada día podemos sacar una cantidad concreta. Hacer de más por el gusto acaba en pan que no se come.</p>
          <p>Lo que no se termina lo damos exactamente el día que toca: kilos de pan de pueblo, bollería y, si nos queda, un pan sin conservantes. Lo que no se tira.</p>
          <h3>Lo que no se tira</h3>
          <p>El pan de un día se rebana, y eso se convierte en pan sin conservantes, sin aceite ni extras.</p>
          <p>La producción limitada y el pago al reservar harán que cada pieza tenga destino antes de que amanezca.</p>
        </div>
        <div className="obrador-editorial__media">
          <Image
            src="/images/obrador/obrador-manos.webp"
            alt="Manos de panadero espolvoreando harina sobre una masa de pan en la bancada de madera del obrador"
            fill
            sizes="(min-width: 64rem) 50vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      {/* 4. CTA oscuro */}
      <section
        className="obrador-cta-section"
        style={{ backgroundImage: "url(/images/obrador/obrador-pan-final.webp)" }}
      >
        <div className="obrador-cta-section__overlay" />
        <Container size="wide" className="container--home obrador-cta-section__content">
          <div className="obrador-cta-section__text">
            <p className="eyebrow">Hecho con tiempo y fuerza</p>
            <h2>El pan empieza antes de que abra la puerta.</h2>
            <Link className="button button--primary" href="/reserva-y-recoge">Ver la selección del día</Link>
          </div>
        </Container>
      </section>

      {/* 5. Newsletter: el bloque del footer, justo antes del grid, ya cumple este paso — evita duplicar el formulario. */}
    </main>
  );
}
