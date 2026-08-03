"use client";
import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  { src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1280&q=72", alt: "" },
  { src: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=1280&q=72", alt: "" },
];

const DWELL_MS = 7000;

/**
 * Cruce lento entre imágenes: la duración de la transición vive en
 * .hero-carousel__slide (transition: opacity 2.4s) para que quede en un
 * solo sitio junto con el resto del sistema visual (Documento globals.css).
 */
export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((current) => (current + 1) % SLIDES.length), DWELL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hero-carousel" aria-label="FUERZA, obrador de masa madre en Asturias">
      {SLIDES.map((slide, index) => (
        <div key={slide.src} className="hero-carousel__slide" data-active={index === active} aria-hidden="true">
          <Image src={slide.src} alt={slide.alt} fill priority={index === 0} unoptimized sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      ))}
      <div className="hero-carousel__overlay" aria-hidden="true" />
      <div className="hero-carousel__content">
        <p className="hero-carousel__subtitle">Obrador artesanal · Asturias, España</p>
        <h1 className="hero-carousel__title">Pan de masa madre, hecho entre dos manos y el tiempo.</h1>
        <Link className="button button--primary hero-carousel__cta" href="/reserva-y-recoge">Reservar y Recoger</Link>
      </div>
    </section>
  );
}
