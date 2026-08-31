import { OrderStatusClient } from "@/components/checkout/order-status";
import { Container, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PaidReturn({ searchParams }: { searchParams: Promise<{ pedido?: string; token?: string }> }) {
  const q = await searchParams;
  return (
    <main id="main-content">
      <Section>
        <Container>
          {q.pedido && q.token ? (
            <OrderStatusClient code={q.pedido} token={q.token} />
          ) : (
            <p>No se ha encontrado la referencia del pedido.</p>
          )}
        </Container>
      </Section>
    </main>
  );
}
