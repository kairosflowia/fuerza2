import { CheckoutClient } from "@/components/checkout/checkout-client";
import { Container, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pago | FUERZA" };

export default async function CheckoutPage() {
  const identity = await getCurrentIdentity();
  return (
    <main id="main-content">
      <Section>
        <Container>
          <CheckoutClient
            initialName={identity?.profile?.full_name ?? ""}
            initialEmail={identity?.user.email ?? ""}
            initialPhone={identity?.profile?.phone ?? ""}
          />
        </Container>
      </Section>
    </main>
  );
}
