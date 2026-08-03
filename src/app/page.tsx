import Image from "next/image";

import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-card" aria-labelledby="page-title">
        <div className="brand-image">
          <Image
            src="/fuerza.jpeg"
            alt="Ilustración del obrador FUERZA"
            width={1254}
            height={1254}
            priority
            sizes="(max-width: 640px) 78vw, 360px"
          />
        </div>

        <div className="landing-copy">
          <p className="eyebrow">Asturias · España</p>
          <h1 id="page-title">{site.name}</h1>
          <p className="tagline">{site.description}</p>
          <p className="status" role="status">
            Estamos amasando algo nuevo. El proyecto está en construcción.
          </p>
        </div>
      </section>
    </main>
  );
}
