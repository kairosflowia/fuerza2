import Link from "next/link";

import { publicNavigation } from "@/lib/navigation";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/ui/icons";

import { Container } from "../ui/layout";

const socialLinks = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
] as const;

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <Container size="wide" className="public-footer__grid">
        <div>
          <p className="wordmark">FUERZA</p>
          <p className="footer-manifesto">Pan artesanal de masa madre elaborado con harinas locales y tiempo real.</p>
          <p>Obrador de masa madre · Avilés, Asturias</p>
          <a href="mailto:hola@fuerza.com" className="footer-email">hola@fuerza.com</a>
          <div className="footer-social" aria-label="Redes sociales de FUERZA">
            {socialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} aria-label={label} className="footer-social__link">
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Navegación del pie">
          <p className="footer-heading">Explora</p>
          {publicNavigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div>
          <p className="footer-heading">Obrador</p>
          <p>Martes a sábado<br />Recogida 10:00–14:30</p>
          <Link href="/donde-estamos">Dónde estamos</Link>
        </div>
        <nav aria-label="Información legal">
          <p className="footer-heading">Información</p>
          <Link href="/contacto">Contacto</Link>
          <Link href="/cuenta/acceder">Mi cuenta</Link>
          <Link href="/plan-de-pan">Fuerza Habitual</Link>
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/condiciones-de-compra">Condiciones de compra</Link>
          <Link href="/politica-de-cancelacion">Política de cancelación</Link>
        </nav>
      </Container>
      <Container size="wide" className="public-footer__bottom">
        <small>© {new Date().getFullYear()} FUERZA</small>
      </Container>
    </footer>
  );
}
