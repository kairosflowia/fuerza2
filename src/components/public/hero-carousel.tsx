import Image from "next/image";
import Link from "next/link";

export function HeroCarousel() {
  return (
    <section className="hero-carousel" aria-label="FUERZA, obrador de masa madre en Asturias">
      <Image
        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=75"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
      <div className="hero-carousel__overlay" aria-hidden="true" />
      <div className="hero-carousel__content">
        <div className="hero-carousel__text">
          <h1 className="hero-carousel__title">Pan de masa madre,<br />hecho entre dos<br />manos y el tiempo.</h1>
          <p className="hero-carousel__subtitle">Fermentación lenta, ingredientes honestos y el oficio artesanal de cada día.</p>
          <div className="hero-carousel__actions">
            <Link className="button button--primary" href="/obrador">Ver el obrador</Link>
            <Link className="button button--secondary hero-carousel__secondary" href="/reserva-y-recoge">Reserva y recoge</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
