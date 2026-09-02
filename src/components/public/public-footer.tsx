import Link from "next/link";

import { FacebookIcon, InstagramIcon } from "@/components/ui/icons";
import { Newsletter } from "./newsletter";

import { Container } from "../ui/layout";

const socialLinks = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
] as const;

const panLinks = [
  { label: "Panes diarios", href: "/reserva-y-recoge/panes-diarios" },
  { label: "Pan especial del día", href: "/reserva-y-recoge/pan-especial-del-dia" },
  { label: "Dulces", href: "/reserva-y-recoge/dulces" },
  { label: "Ver todo el pan", href: "/reserva-y-recoge" },
] as const;

const infoLinks = [
  { label: "Reserva y recoge", href: "/reserva-y-recoge" },
  { label: "Fuerza Habitual", href: "/plan-de-pan" },
  { label: "Dónde estamos", href: "/donde-estamos" },
  { label: "Mi cuenta", href: "/cuenta/acceder" },
] as const;

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <Container size="wide" className="container--home footer-newsletter">
        <Newsletter />
      </Container>
      <Container size="wide" className="container--home public-footer__grid">
        <div className="public-footer__brand">
          <p className="wordmark">FUERZA</p>
          <p className="footer-manifesto">Pan de masa madre, hecho entre dos manos y el tiempo.</p>
          <div className="footer-social" aria-label="Redes sociales de FUERZA">
            {socialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} aria-label={label} className="footer-social__link">
                <Icon />
              </a>
            ))}
          </div>
          <p>Obrador de masa madre · Avilés, Asturias</p>
        </div>
        <nav aria-label="Navegación del pie: pan">
          <p className="footer-heading">Pan</p>
          {panLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <nav aria-label="Navegación del pie: información">
          <p className="footer-heading">Información</p>
          {infoLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div>
          <p className="footer-heading">Contacto</p>
          <a href="mailto:hola@fuerza.com" className="footer-email">hola@fuerza.com</a>
          <p>Martes a sábado<br />Recogida 10:00–14:30</p>
        </div>
        <div className="footer-seal" aria-hidden="true">
          <span>Masa madre</span>
          <span className="footer-seal__mark">F</span>
          <span>Oficio artesanal</span>
        </div>
      </Container>
      <Container size="wide" className="container--home public-footer__bottom">
        <small>© {new Date().getFullYear()} FUERZA</small>
        <nav aria-label="Información legal" className="footer-legal">
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Política de privacidad</Link>
          <Link href="/cookies">Política de cookies</Link>
        </nav>
      </Container>
    </footer>
  );
}
