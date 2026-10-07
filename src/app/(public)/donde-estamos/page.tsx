/* eslint-disable @next/next/no-img-element -- ilustración vectorial decorativa. */
import Image from "next/image";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { PickupMap } from "@/components/public/pickup-map";
import { EmptyState } from "@/components/ui";
import { ArrowRightIcon, BreadIcon, CalendarIcon, CartIcon, ClockIcon, PinIcon } from "@/components/ui/icons";
import {
  PICKUP_EXCEPTION_TYPE_LABELS_ES,
  PICKUP_POINT_STATUS_LABELS_ES,
  directionsUrl,
  getPublicPickupPoints,
  mainBakery,
} from "@/lib/pickup-points";
import { summarizeCollectionWindows, summarizeOpeningHours } from "@/lib/pickup-schedule";
import { formatDateEs } from "@/lib/order-cutoff";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Dónde estamos",
  description: "Información sobre el obrador FUERZA en Avilés y sus puntos de recogida.",
  path: "/donde-estamos",
});

const NOTES = [
  { Icon: CalendarIcon, text: "Cada punto tiene sus propios días y horarios." },
  { Icon: CartIcon, text: "Tu reserva indicará el punto, día y ventana de recogida disponible." },
  { Icon: BreadIcon, text: "Solo mostramos puntos y opciones compatibles con tu pan." },
] as const;

export default async function DondeEstamosPage() {
  const { points } = await getPublicPickupPoints();
  const bakery = mainBakery(points);
  const ordered = [...points].sort((a, b) => {
    if (a.is_main_bakery !== b.is_main_bakery) return a.is_main_bakery ? -1 : 1;
    return a.display_order - b.display_order;
  });
  const mapPoints = ordered.flatMap((point) =>
    point.latitude != null && point.longitude != null
      ? [{ id: point.id, name: point.name, latitude: point.latitude, longitude: point.longitude, isMain: point.is_main_bakery }]
      : [],
  );

  return (
    <main id="main-content" className="fz-places">
      <div className="fz-container fz-places__intro">
        <PageIntro
          variant="editorial"
          eyebrow="Avilés, Asturias"
          title="Dónde estamos"
          description={
            bakery
              ? "Puedes recoger tu pan en el obrador o en cualquiera de nuestros puntos de recogida. Cada uno tiene sus propios días y horarios."
              : "Horneamos en Asturias y estamos preparando una red de recogida cercana y fácil de entender."
          }
        />
        <img className="fz-places__wheat" src="/illustrations/sprig.svg" alt="" aria-hidden="true" width={107} height={61} />
      </div>

      <div className="fz-container">
        {mapPoints.length ? <PickupMap points={mapPoints} /> : null}

        {ordered.length ? (
          <ul className="fz-places__list">
            {ordered.map((point) => {
              const link = directionsUrl(point);
              const address = [point.address_line_1, point.address_line_2, point.city].filter(Boolean).join(", ");
              const opening = summarizeOpeningHours(point.openingHours.map((h) => ({ weekday: h.weekday, opensAt: h.opens_at, closesAt: h.closes_at, isClosed: h.is_closed })));
              const collection = summarizeCollectionWindows(point.collectionWindows.map((w) => ({ weekday: w.weekday, startsAt: w.starts_at, endsAt: w.ends_at })));
              const comingSoon = point.status === "coming_soon";
              const badge = comingSoon ? PICKUP_POINT_STATUS_LABELS_ES.coming_soon : point.is_main_bakery ? "Obrador principal" : "Punto de recogida";

              return (
                <li key={point.id} className={`fz-place${point.is_main_bakery ? " fz-place--photo" : ""}`}>
                  {point.is_main_bakery ? (
                    <div className="fz-place__media">
                      <Image src="/images/home/obrador-fuerza-fachada.jpg" alt={`Fachada de ${point.name}`} fill sizes="(min-width: 48rem) 220px, 120px" />
                    </div>
                  ) : null}
                  <div className="fz-place__body">
                    <span className={`fz-place__badge${point.is_main_bakery ? " fz-place__badge--main" : ""}${comingSoon ? " fz-place__badge--soon" : ""}`}>{badge}</span>
                    <h2 className="fz-place__name">{point.name}</h2>
                    {address ? <p className="fz-place__line"><PinIcon />{address}</p> : null}
                    {opening ? <p className="fz-place__line"><ClockIcon />{opening}</p> : null}
                    {collection ? (
                      <p className="fz-place__line fz-place__line--muted"><CartIcon />Recogida de pedidos: {collection}</p>
                    ) : (
                      <p className="fz-place__line fz-place__line--muted">Todavía no hay franjas de recogida publicadas para este punto.</p>
                    )}
                    {point.upcomingException ? (
                      <p className="fz-place__note">
                        <strong>{PICKUP_EXCEPTION_TYPE_LABELS_ES[point.upcomingException.type]}</strong> el {formatDateEs(point.upcomingException.exception_date).toLowerCase()}
                        {point.upcomingException.public_message ? `: ${point.upcomingException.public_message}` : ""}
                      </p>
                    ) : null}
                    {point.public_instructions ? <p className="fz-place__note">{point.public_instructions}</p> : null}
                  </div>
                  {link ? (
                    <Link className="fz-place__directions" href={link} target="_blank" rel="noopener noreferrer">
                      Cómo llegar
                      <ArrowRightIcon />
                      <span className="sr-only"> a {point.name} (se abre en una pestaña nueva)</span>
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no hemos publicado ningún punto"
            description="Estamos confirmando la dirección y los horarios del obrador. En cuanto estén listos, los verás aquí."
          />
        )}

        <section className="fz-before" aria-labelledby="before-title">
          <p className="fz-eyebrow">Antes de venir</p>
          <h2 id="before-title" className="fz-display">Ten en cuenta</h2>
          <ul className="fz-before__list">
            {NOTES.map(({ Icon, text }) => (
              <li key={text}>
                <Icon />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
