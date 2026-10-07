import Link from "next/link";

import { ContactForm } from "@/components/public/contact-form";
import { PageIntro } from "@/components/public/page-intro";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { getPublicPickupPoints, mainBakery } from "@/lib/pickup-points";
import { summarizeOpeningHours } from "@/lib/pickup-schedule";
import { createPageMetadata } from "@/lib/seo";
import { contact } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Contacto",
  description: "Información de contacto del obrador FUERZA en Asturias.",
  path: "/contacto",
});

export default async function ContactoPage() {
  const { points } = await getPublicPickupPoints();
  const bakery = mainBakery(points);
  // Horario real del obrador, solo los días abiertos (los cerrados no caben en la tarjeta).
  const openingHours = bakery
    ? summarizeOpeningHours(
        bakery.openingHours
          .filter((h) => !h.is_closed)
          .map((h) => ({ weekday: h.weekday, opensAt: h.opens_at, closesAt: h.closes_at, isClosed: h.is_closed })),
      )
    : null;
  const location = bakery ? [bakery.address_line_1, bakery.city].filter(Boolean).join(", ") : contact.location;

  return (
    <main id="main-content" className="fz-contact-page">
      <div className="fz-container">
        <div className="fz-contact-page__intro">
          <PageIntro
            variant="editorial"
            breadcrumbs
            eyebrow="Hablemos"
            title="Contacto"
            description="Escríbenos para consultas generales, recogidas o colaboraciones. Te respondemos por correo."
          />
        </div>

        <ul className="fz-contact-cards">
          <li>
            <a className="fz-contact-card" href={`mailto:${contact.email}`}>
              <span className="fz-contact-card__icon" aria-hidden="true"><MailIcon /></span>
              <span className="fz-contact-card__title">Correo</span>
              <span className="fz-contact-card__value">{contact.email}</span>
              <span className="fz-contact-card__meta">Nuestra vía principal</span>
            </a>
          </li>
          <li>
            <a className="fz-contact-card" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              <span className="fz-contact-card__icon" aria-hidden="true"><PhoneIcon /></span>
              <span className="fz-contact-card__title">Teléfono</span>
              <span className="fz-contact-card__value">{contact.phone}</span>
              {openingHours ? <span className="fz-contact-card__meta">{openingHours}</span> : null}
            </a>
          </li>
          <li>
            <Link className="fz-contact-card" href="/donde-estamos">
              <span className="fz-contact-card__icon" aria-hidden="true"><PinIcon /></span>
              <span className="fz-contact-card__title">Visítanos</span>
              <span className="fz-contact-card__value">{location}</span>
              <span className="fz-contact-card__meta">Cómo llegar</span>
            </Link>
          </li>
        </ul>

        <ContactForm />
      </div>
    </main>
  );
}
