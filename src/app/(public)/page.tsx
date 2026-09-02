import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { EditorialProductPreview, TextLink } from "@/components/public/editorial";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { WeeklySpecialBanner } from "@/components/public/weekly-special-banner";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { getPublicCatalog } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { SUBSCRIPTION_DISCOUNT_PERCENT, SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS } from "@/lib/subscriptions-domain";
import { getCurrentWeeklySpecial } from "@/lib/weekly-special";

export const metadata: Metadata = createPageMetadata({
  title: "Pan de masa madre en Asturias",
  description: "Obrador de masa madre en Asturias. Harinas locales, fermentación lenta y cantidad limitada cada día. Reserva tu pan y recógelo cuando te venga bien.",
  path: "/",
  ogTitle: "FUERZA — Obrador de masa madre en Asturias",
  ogDescription: "Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta.",
});

const CRAFT_FEATURES = [
  { icon: "/masa-madre.png", title: "Masa madre viva", text: "Cuidamos nuestra masa madre cada día. Es el corazón de nuestro pan." },
  { icon: "/fermentacion.png", title: "Fermentación lenta", text: "Largas fermentaciones que desarrollan sabor, mejoran la digestibilidad y conservan lo esencial." },
  { icon: "/harinas.png", title: "Harinas seleccionadas", text: "Trabajamos con harinas ecológicas de cercanía y moliendas que respetan el grano." },
  { icon: "/oficio-artesanal.png", title: "Oficio artesanal", text: "Amasado, formado y horneado a mano, en pequeñas tandas, cada día." },
] as const;

export default async function Home() {
  const [catalog, weeklySpecial] = await Promise.all([getPublicCatalog(), getCurrentWeeklySpecial()]);
  const dailyBreads = catalog.filter((p) => p.family?.slug === "panes-diarios").slice(0, 4);
  const dailyBreadPrices = dailyBreads
    .flatMap((product) => product.variants.filter((v) => v.status === "active" && v.price_cents !== null))
    .map((v) => v.price_cents!);
  const cheapestDailyPriceCents = dailyBreadPrices.length ? Math.min(...dailyBreadPrices) : null;
  const weeklyFromCents = cheapestDailyPriceCents !== null
    ? Math.round(cheapestDailyPriceCents * SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100))
    : null;

  return (
    <main id="main-content" className="home-theme">
      <HeroCarousel />

      {weeklySpecial ? (
        <Section>
          <Container size="wide" className="container--home">
            <WeeklySpecialBanner special={weeklySpecial} />
          </Container>
        </Section>
      ) : null}

      <Section className="home-section">
        <Container size="wide" className="container--home">
          <div className="section-heading-row">
            <h2>Hoy en FUERZA</h2>
            <TextLink href="/reserva-y-recoge">Ver todo el pan</TextLink>
          </div>
          <div className="editorial-grid editorial-grid--4 hoy-grid">
            {dailyBreads.map((product) => {
              const image = product.images.find((i) => i.is_primary) ?? product.images[0];
              const prices = product.variants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));
              return (
                <EditorialProductPreview
                  key={product.id}
                  href={`/reserva-y-recoge/${product.family?.slug}/${product.slug}`}
                  name={product.name}
                  description={product.short_description}
                  imagePath={image?.storage_path ?? null}
                  imageAlt={image?.alt_text ?? ""}
                  priceCents={prices.length ? Math.min(...prices) : null}
                />
              );
            })}
          </div>
        </Container>
      </Section>

      <Section tone="sunken" className="home-section">
        <Container size="wide" className="container--home">
          <div className="craft-section">
            <div className="craft-section__left">
              <h2>Así hacemos nuestro pan</h2>
              <p className="craft-section__lead">Tiempo, respeto y oficio. Nada más, nada menos.</p>
              <div className="craft-features">
                {CRAFT_FEATURES.map(({ icon, title, text }) => (
                  <div key={title} className="craft-feature">
                    <span className="craft-feature__icon" aria-hidden="true">
                      <Image src={icon} alt="" width={48} height={48} />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="craft-section__media">
              <Image
                src="https://images.unsplash.com/photo-1595801105145-795f1927c0fc?auto=format&fit=crop&w=800&q=75"
                alt="Manos amasando una masa de pan espolvoreada con harina"
                width={800}
                height={1000}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section className="habitual-section home-section">
        <Container size="wide" className="container--home">
          <div className="habitual-banner">
            <div className="habitual-banner__media">
              <Image
                src="/bolsa-fuerza.png"
                alt="Bolsa de tela FUERZA con hogazas de masa madre"
                width={1254}
                height={1254}
              />
            </div>
            <div className="habitual-banner__body">
              <p className="eyebrow">Fuerza Habitual</p>
              <h3>Tu pan de cada día, sin que tengas que pensarlo.</h3>
              <p>Un plan pensado para quienes valoran el tiempo, la constancia y el buen pan.</p>
              <ul className="habitual-banner__checklist">
                <li><CheckIcon width={16} height={16} aria-hidden="true" /> Pan reservado cada semana</li>
                <li><CheckIcon width={16} height={16} aria-hidden="true" /> Recógelo cuando te venga bien</li>
                <li><CheckIcon width={16} height={16} aria-hidden="true" /> Ahorra y disfruta de ventajas</li>
              </ul>
            </div>
            <div className="habitual-banner__price">
              <p className="habitual-banner__price-label">Desde</p>
              {weeklyFromCents !== null ? (
                <p className="habitual-banner__price-value">{formatPrice(weeklyFromCents)}<span> / semana</span></p>
              ) : null}
              <p className="habitual-banner__price-note">Cancela o pausa cuando quieras.</p>
              <Link className="button button--primary button--full" href="/plan-de-pan/membresias">Quiero mi pan habitual</Link>
              <Link className="text-link" href="/plan-de-pan">Saber más</Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
