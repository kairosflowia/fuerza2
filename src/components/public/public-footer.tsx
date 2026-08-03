import Link from "next/link";

import { publicNavigation } from "@/lib/navigation";

import { Container } from "../ui/layout";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <Container size="wide" className="public-footer__grid">
        <div>
          <p className="wordmark wordmark--inverse">FUERZA</p>
          <p>Obrador de masa madre<br />Asturias · España</p>
        </div>
        <nav aria-label="Navegación del pie">
          <p className="footer-heading">Explora</p>
          {publicNavigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div>
          <p className="footer-heading">Obrador</p>
          <p>Horario general<br />09:00–18:00</p>
          <Link href="/donde-estamos">Dónde estamos</Link>
        </div>
        <nav aria-label="Información legal">
          <p className="footer-heading">Información</p>
          <Link href="/contacto">Contacto</Link>
          <Link href="/cuenta/acceder">Mi cuenta</Link>
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/condiciones-de-compra">Condiciones de compra</Link>
        </nav>
      </Container>
      <Container size="wide" className="public-footer__bottom">
        <small>© FUERZA</small>
      </Container>
    </footer>
  );
}
