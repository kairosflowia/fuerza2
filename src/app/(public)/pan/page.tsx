import { redirect } from "next/navigation";

/**
 * El catálogo editorial y "Reserva y recoge" eran dos lugares distintos para
 * comprar el mismo pan (Fase 2 del Plano Mestre UX/UI). Se unificaron en una
 * única experiencia de compra; este slug se conserva como redirección para
 * no romper enlaces y resultados de búsqueda ya indexados.
 */
export default async function PanRedirect({ searchParams }: { searchParams: Promise<{ familia?: string }> }) {
  const { familia } = await searchParams;
  redirect(familia ? `/reserva-y-recoge/${familia}` : "/reserva-y-recoge");
}
