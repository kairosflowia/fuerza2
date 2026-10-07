/* eslint-disable @next/next/no-img-element -- ilustraciones vectoriales de marca. */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { ArrowRightIcon } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Quiénes somos — obrador en Asturias",
  description: "Somos un obrador pequeño de masa madre en Avilés, Asturias. Trabajamos con harinas locales y con la gente que tenemos cerca.",
  path: "/nosotros",
  ogTitle: "Somos un obrador pequeño",
  ogDescription: "Masa madre en Asturias. Harina de aquí y las manos que hacen falta.",
});

/** Iconos de los valores, en el color de cada tarjeta (mismo trazo artesanal que las ilustraciones). */
const ValueIcons = {
  tradition: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 28c3-6 6-13 12-23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.5 20.5c-3.5.2-6-1.6-6.8-4.4 3.2-.6 6 .9 6.8 4.4ZM16.5 14.6c-3.3-.5-5.4-2.8-5.6-5.7 3.2.1 5.5 2.2 5.6 5.7ZM15.2 22.4c.8-3.4 3.2-5.3 6.2-5.3-.4 3.2-2.8 5.2-6.2 5.3ZM18.4 16.3c.4-3.4 2.6-5.6 5.6-5.9-.1 3.2-2.3 5.5-5.6 5.9ZM20.6 9.9c-.2-2.8 1.2-4.9 3.7-5.6.3 2.6-1.1 4.8-3.7 5.6Z" fill="currentColor" />
    </svg>
  ),
  ingredients: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M12.5 15.5c-2.6-1.6-3.4-5.2-1.8-8 2.6 1.6 3.4 5.2 1.8 8ZM19.5 15.5c-1.6-2.8-.8-6.4 1.8-8 1.6 2.8.8 6.4-1.8 8ZM16 27c-2.6-1.8-3.2-5.6-1.3-8.4 2.5 1.8 3.1 5.6 1.3 8.4ZM9.2 25.6c-3-.4-5-3.4-4.5-6.6 3 .4 5 3.4 4.5 6.6ZM22.8 25.6c-.5-3.2 1.5-6.2 4.5-6.6.5 3.2-1.5 6.2-4.5 6.6Z" fill="currentColor" />
    </svg>
  ),
  time: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 29V15c0-4 2-7.5 6-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 18c-5.6.6-9.4-2.3-10-7.6 5.2-.4 9.3 2.6 10 7.6ZM17.2 13.2c.5-5.4 4.3-8.5 9.6-8.3-.2 5.2-4.3 8.6-9.6 8.3Z" fill="currentColor" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="16" cy="9.5" r="3.4" />
      <circle cx="7.8" cy="13" r="2.7" />
      <circle cx="24.2" cy="13" r="2.7" />
      <path d="M9.5 26c.6-4.4 3.3-7 6.5-7s5.9 2.6 6.5 7M3 25c.4-3.4 2.3-5.4 4.8-5.6M29 25c-.4-3.4-2.3-5.4-4.8-5.6" />
    </svg>
  ),
} as const;

const VALUES = [
  { title: "Tradición que se siente", text: "Hacemos lo que sabemos que funciona, sin usar la nostalgia como argumento.", tone: "terracotta", icon: ValueIcons.tradition },
  { title: "Ingredientes que cuentan", text: "Cada ingrediente tiene una tarea y una procedencia que debe poder explicarse.", tone: "mustard", icon: ValueIcons.ingredients },
  { title: "Tiempo que transforma", text: "La masa marca el ritmo. No fingimos que ese tiempo se puede acelerar.", tone: "green", icon: ValueIcons.time },
  { title: "Comunidad que nos inspira", text: "Un obrador pequeño existe por la gente que trabaja y por quienes vuelven a elegirlo.", tone: "blue", icon: ValueIcons.community },
] as const;

export default function NosotrosPage() {
  return (
    <main id="main-content" className="fz-about">
      <div className="fz-container fz-about__intro">
        <PageIntro
          variant="editorial"
          breadcrumbs
          eyebrow="Las personas"
          title="Nosotros"
          description="Somos un obrador pequeño de masa madre en Avilés, Asturias."
        />
      </div>

      {/* Friso con las ilustraciones originales de FUERZA: quienes cultivan, amasan, reparten y esperan el pan. */}
      <div className="fz-frieze" role="img" aria-label="Ilustraciones de FUERZA: personas que cultivan, amasan y reparten el pan, con espigas y una gallina.">
        <span className="fz-frieze__sun" aria-hidden="true" />
        <div className="fz-frieze__row" aria-hidden="true">
          <img className="fz-frieze__sprig" src="/illustrations/sprig.svg" alt="" width={70} height={40} />
          <img src="/illustrations/man-wheat.svg" alt="" width={84} height={100} />
          <img className="fz-frieze__optional" src="/illustrations/man-hat-bread.png" alt="" width={83} height={100} />
          <img src="/illustrations/woman-bread.svg" alt="" width={60} height={100} />
          <img className="fz-frieze__optional" src="/illustrations/woman-bowl.svg" alt="" width={73} height={100} />
          <img className="fz-frieze__bird" src="/illustrations/bird.svg" alt="" width={50} height={48} />
          <img className="fz-frieze__sprig fz-frieze__sprig--end" src="/illustrations/sprig-terracotta.svg" alt="" width={70} height={40} />
        </div>
      </div>

      <section className="fz-about__band" aria-labelledby="why-here">
        <div className="fz-container fz-about__band-inner">
          <div>
            <h2 id="why-here" className="fz-display">Por qué aquí</h2>
            <p>Asturias tiene cereal, molinos y gente que sabe de esto. Estamos en Avilés y queremos mantener cerca el origen de lo que usamos.</p>
            <p>Los nombres de productores y molinos se publicarán solo cuando estén confirmados.</p>
          </div>
          <img className="fz-about__band-art" src="/illustrations/sprig-terracotta.svg" alt="" aria-hidden="true" width={107} height={61} />
        </div>
      </section>

      <div className="fz-container">
        <section className="fz-values" aria-labelledby="values-title">
          <h2 id="values-title" className="fz-display">El pan no se levanta solo</h2>
          <p className="fz-values__lead">Hay quien cultiva el cereal, quien lo muele, quien amasa y quien espera al otro lado del mostrador. Nosotros estamos en medio.</p>
          <ul className="fz-values__list">
            {VALUES.map(({ title, text, tone, icon }) => (
              <li key={title} className={`fz-value fz-value--${tone}`}>
                <span className="fz-value__icon">{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <Link className="fz-about__cta" href="/obrador">
          <span className="fz-about__cta-copy">
            <span className="fz-eyebrow">El obrador</span>
            <span className="fz-about__cta-title">Un lugar con nombre propio</span>
            <span className="fz-about__cta-text">Avilés es nuestra casa. Aquí elaboramos cada hogaza con calma, oficio y personas reales.</span>
          </span>
          <span className="fz-about__cta-media">
            <Image src="/images/home/hero-pan-rustico-madera.jpg" alt="" fill sizes="(min-width: 48rem) 420px, 40vw" />
            <span className="fz-about__cta-arrow" aria-hidden="true"><ArrowRightIcon /></span>
          </span>
        </Link>
      </div>
    </main>
  );
}
