"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type NetworkInformation = { saveData?: boolean };

/**
 * El vídeo nunca es la primera pintura: la imagen de póster ocupa su lugar
 * hasta que el vídeo entra en el viewport (IntersectionObserver) y termina
 * de cargar. Se omite por completo con "Ahorro de datos" activado o con
 * prefers-reduced-motion, dejando solo el póster (Documento de la petición).
 */
export function HeroVideo({
  videoSrc,
  poster,
  posterAlt,
  children,
}: {
  videoSrc: string;
  poster: string;
  posterAlt: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (reducedMotion || connection?.saveData) return;

    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="hero-video">
      <Image src={poster} alt={posterAlt} fill priority={false} sizes="100vw" style={{ objectFit: "cover" }} className="hero-video__poster" />
      {shouldLoad ? (
        <video
          className={cn("hero-video__media", videoReady && "hero-video__media--visible")}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={poster}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}
      <div className="hero-video__overlay" aria-hidden="true" />
      <div className="hero-video__content split-section">{children}</div>
    </div>
  );
}
