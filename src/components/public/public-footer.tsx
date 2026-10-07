/* eslint-disable @next/next/no-img-element -- ilustraciones y logotipo vectoriales de marca. */
import Link from "next/link";

import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TikTokIcon, YouTubeIcon } from "@/components/ui/icons";
import { footerNavigation } from "@/lib/navigation";
import { contact, socialProfiles } from "@/lib/site";

import { Newsletter } from "./newsletter";

const socialIcons = { instagram: InstagramIcon, facebook: FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon } as const;

export function ContactStrip() {
  return (
    <ul className="fz-contact__list">
      <li className="fz-contact__item">
        <PhoneIcon />
        <span className="fz-contact__label">Llámanos</span>
        <a className="fz-contact__value" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
      </li>
      <li className="fz-contact__item">
        <MailIcon />
        <span className="fz-contact__label">Escríbenos</span>
        <a className="fz-contact__value" href={`mailto:${contact.email}`}>{contact.email}</a>
      </li>
      <li className="fz-contact__item">
        <PinIcon />
        <span className="fz-contact__label">Visítanos</span>
        <Link className="fz-contact__value" href="/donde-estamos">{contact.location}</Link>
      </li>
    </ul>
  );
}

export function SocialLinks() {
  return (
    <ul className="fz-social" aria-label="Redes sociales de FUERZA">
      {socialProfiles.map(({ network, label, href }) => {
        const Icon = socialIcons[network];
        return (
          <li key={network}>
            <a className={`fz-social--${network}`} href={href} aria-label={label}>
              <Icon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function PublicFooter() {
  return (
    <footer className="fz-container fz-footer">
      <section className="fz-community" aria-labelledby="community-title">
        <div className="fz-community__intro">
          <h2 id="community-title">Únete a nuestra comunidad</h2>
          <p>Recibe novedades, panes de temporada y mucho más.</p>
        </div>
        <Newsletter />
        <div className="fz-contact">
          <ContactStrip />
          <SocialLinks />
        </div>
      </section>

      <div className="fz-footer__main">
        <Link href="/" className="fz-footer__brand" aria-label="FUERZA, inicio">
          <img src="/illustrations/fuerza-wordmark.svg" alt="" width={150} height={48} />
        </Link>
        <nav className="fz-footer__nav" aria-label="Navegación del pie">
          {footerNavigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="fz-footer__people" aria-hidden="true">
          <img src="/illustrations/woman-bowl.svg" alt="" width={57} height={78} />
          <img src="/illustrations/man-wheat.svg" alt="" width={64} height={78} />
          <img src="/illustrations/woman-bread.svg" alt="" width={47} height={78} />
          <img className="fz-footer__bird" src="/illustrations/bird.svg" alt="" width={47} height={46} />
          <img className="fz-footer__sprig" src="/illustrations/sprig.svg" alt="" width={91} height={52} />
        </div>
      </div>

      <div className="fz-footer__legal">
        <small>© {new Date().getFullYear()} FUERZA PAN, S.L. Todos los derechos reservados.</small>
        <nav aria-label="Información legal">
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/condiciones-de-compra">Condiciones de compra</Link>
        </nav>
      </div>
    </footer>
  );
}
