import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Acceso denegado", description: "No tienes permiso para acceder a esta zona.", path: "/cuenta/acceso-denegado" });

export default function AccessDeniedPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Permisos" title="No tienes acceso a esta zona" description="Tu cuenta está activa, pero no tiene una función administrativa asignada." />
      <Section><Container><Link className="button button--primary" href="/cuenta">Volver a mi cuenta</Link></Container></Section>
    </main>
  );
}
