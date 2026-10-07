"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

import { LocateIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";

export type MapPoint = { id: string; name: string; latitude: number; longitude: number; isMain: boolean };

/**
 * Imagen estática generada una sola vez a partir de OpenStreetMap
 * (public/images/donde-estamos/mapa-aviles.jpg): centro y zoom con los que
 * se recortó, para situar los pines encima sin pedir nada a terceros.
 */
const STATIC_MAP = { src: "/images/donde-estamos/mapa-aviles.jpg", latitude: 43.555933, longitude: -5.92454, zoom: 15, width: 1400, height: 560 };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function project(latitude: number, longitude: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((latitude * Math.PI) / 180);
  return { x: ((longitude + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}

const pinSvg =
  '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 31s10-10.6 10-18.5C22 6.2 17.5 1.5 12 1.5S2 6.2 2 12.5C2 20.4 12 31 12 31Z" fill="#C84A25"/><circle cx="12" cy="12.5" r="4" fill="#FBF6ED"/></svg>';

function Pin({ point }: { point: MapPoint }) {
  return (
    <span className={`fz-map__pin${point.isMain ? " fz-map__pin--main" : ""}`}>
      <span className="fz-map__pin-icon" dangerouslySetInnerHTML={{ __html: pinSvg }} />
      <span className="fz-map__pin-label">{point.name}</span>
    </span>
  );
}

/**
 * Mapa de puntos de recogida. Por privacidad y rendimiento, el mapa
 * interactivo (Leaflet + teselas de OpenStreetMap) solo se carga cuando la
 * persona lo activa; antes se muestra una imagen estática con los mismos
 * pines.
 */
export function PickupMap({ points }: { points: MapPoint[] }) {
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletMap | null>(null);
  const fitRef = useRef<() => void>(() => {});

  // Escala de la imagen estática con object-fit: cover, para colocar los pines.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(Math.max(frame.clientWidth / STATIC_MAP.width, frame.clientHeight / STATIC_MAP.height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !mapRef.current || leafletRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        // En móvil, un dedo desplaza la página; el mapa se mueve con los botones o con dos dedos.
        dragging: !L.Browser.mobile,
        attributionControl: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "fz-map__tiles",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      for (const point of points) {
        // El nombre viene de la base de datos: se escapa antes de insertarlo en el HTML del pin.
        L.marker([point.latitude, point.longitude], {
          title: point.name,
          icon: L.divIcon({
            className: "",
            html: `<span class="fz-map__pin${point.isMain ? " fz-map__pin--main" : ""}"><span class="fz-map__pin-icon">${pinSvg}</span><span class="fz-map__pin-label">${escapeHtml(point.name)}</span></span>`,
            iconSize: [0, 0],
          }),
        }).addTo(map);
      }
      const fit = () => {
        if (points.length === 1) map.setView([points[0].latitude, points[0].longitude], STATIC_MAP.zoom);
        else map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])), { padding: [48, 48], maxZoom: 16 });
      };
      fit();
      fitRef.current = fit;
      leafletRef.current = map;
    })();
    return () => {
      cancelled = true;
    };
  }, [active, points]);

  useEffect(() => () => {
    leafletRef.current?.remove();
    leafletRef.current = null;
  }, []);

  const center = project(STATIC_MAP.latitude, STATIC_MAP.longitude, STATIC_MAP.zoom);
  const control = (action: "in" | "out" | "fit") => {
    if (!active) return setActive(true);
    const map = leafletRef.current;
    if (!map) return;
    if (action === "in") map.zoomIn();
    else if (action === "out") map.zoomOut();
    else fitRef.current();
  };

  return (
    <section className="fz-map" aria-label="Mapa de puntos de recogida">
      <div ref={frameRef} className="fz-map__frame">
        {active ? (
          <div ref={mapRef} className="fz-map__live" />
        ) : (
          <>
            <Image src={STATIC_MAP.src} alt="" fill sizes="(min-width: 64rem) 1280px, 100vw" className="fz-map__static" />
            {points.map((point) => {
              const p = project(point.latitude, point.longitude, STATIC_MAP.zoom);
              return (
                <span key={point.id} className="fz-map__static-pin" style={{ left: `calc(50% + ${(p.x - center.x) * scale}px)`, top: `calc(50% + ${(p.y - center.y) * scale}px)` }}>
                  <Pin point={point} />
                </span>
              );
            })}
            <button type="button" className="fz-map__activate" onClick={() => setActive(true)}>
              Ver mapa interactivo
            </button>
            <span className="fz-map__credit">© OpenStreetMap</span>
          </>
        )}
        <div className="fz-map__controls">
          <button type="button" aria-label="Acercar" onClick={() => control("in")}><PlusIcon /></button>
          <button type="button" aria-label="Alejar" onClick={() => control("out")}><MinusIcon /></button>
          <button type="button" aria-label="Centrar en los puntos de recogida" onClick={() => control("fit")}><LocateIcon /></button>
        </div>
      </div>
    </section>
  );
}
