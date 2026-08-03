import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "../actions";
import { AuthForm } from "@/components/account/auth-form";
import { PageIntro } from "@/components/public/page-intro";
import { Alert, Container, Section } from "@/components/ui";
import { safeReturnPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Acceder a tu cuenta", description: "Accede a tu cuenta FUERZA.", path: "/cuenta/acceder" });

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const next = safeReturnPath(query.next);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(next);
  }
  return (
    <main id="main-content">
      <PageIntro eyebrow="Tu cuenta" title="Acceder" description="Entra para consultar y actualizar tus datos. Comprar sin cuenta seguirá siendo posible cuando abramos las reservas." />
      <Section><Container className="auth-layout">
        <div>
          {query.error ? <Alert variant="error" title="Enlace no válido">No hemos podido confirmar el acceso. Solicita un enlace nuevo o vuelve a intentarlo.</Alert> : null}
          <AuthForm action={signInAction} fields={["email", "password"]} submitLabel="Acceder" next={next} />
          <div className="auth-links"><Link href="/cuenta/recuperar">He olvidado mi contraseña</Link><Link href="/cuenta/crear">Crear una cuenta</Link></div>
        </div>
      </Container></Section>
    </main>
  );
}
