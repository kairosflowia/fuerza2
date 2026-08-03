import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/layout";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main id="main-content" className="technical-home">
      <Container size="wide">
        <section className="landing-card" aria-labelledby="page-title">
          <div className="brand-image">
            <Image src="/fuerza.jpeg" alt="Ilustración del obrador FUERZA" width={1254} height={1254} priority sizes="(max-width: 767px) 90vw, 44vw" />
          </div>
          <div className="landing-copy">
            <p className="eyebrow">Asturias · España</p>
            <h1 id="page-title">{site.name}</h1>
            <p className="tagline">{site.description}</p>
            <p className="status">Estamos amasando algo nuevo. El proyecto está en construcción.</p>
            <Link className="button button--primary" href="/reserva">Reserva y recoge</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
