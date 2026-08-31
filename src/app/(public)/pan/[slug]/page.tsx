import { notFound, redirect } from "next/navigation";

import { getPublicProduct } from "@/lib/catalog";

/**
 * Ficha de producto retirada del catálogo editorial: la venta ahora vive
 * solo en /reserva-y-recoge/[familia]/[producto] (Fase 2, unificación de
 * flujos). Redirige para no romper enlaces y resultados de búsqueda ya
 * indexados.
 */
export default async function PanProductRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProduct((await params).slug);
  if (!product?.family) notFound();
  redirect(`/reserva-y-recoge/${product.family.slug}/${product.slug}`);
}
