import { OrderStatusClient } from "@/components/checkout/order-status";
import { Container, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function GuestOrderPage({ params, searchParams }: { params: Promise<{ publicCode: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ publicCode }, { token }] = await Promise.all([params, searchParams]);
  return (
    <main id="main-content">
      <Section>
        <Container>
          {token ? <OrderStatusClient code={publicCode} token={token} /> : <p>Este enlace no incluye un token de consulta válido.</p>}
        </Container>
      </Section>
    </main>
  );
}
