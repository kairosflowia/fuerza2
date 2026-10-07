import "server-only";

import { getVariantAvailability, getVariantOrderLimit } from "@/lib/availability";
import type { CatalogProduct } from "@/lib/catalog";

/**
 * Datos que necesita una tarjeta de producto con "añadir rápido": la
 * variante activa más barata, su disponibilidad y el tope real de pedido
 * para el punto y la fecha de recogida elegidos. Solo orquesta las
 * consultas existentes (getVariantAvailability / getVariantOrderLimit).
 */
export async function getQuickAddProducts(products: CatalogProduct[], pickupPointId: string | null, collectionDate: string) {
  const cheapestByProduct = products.map((product) => {
    const activeVariants = product.variants.filter((v) => v.status === "active" && v.price_cents !== null);
    const cheapest = activeVariants.length ? activeVariants.reduce((min, v) => (v.price_cents! < min.price_cents! ? v : min)) : null;
    return { product, cheapest };
  });

  const [availabilities, orderLimits] = pickupPointId
    ? await Promise.all([
        Promise.all(cheapestByProduct.map(({ cheapest }) => (cheapest ? getVariantAvailability(cheapest.id, pickupPointId, collectionDate) : Promise.resolve(null)))),
        Promise.all(cheapestByProduct.map(({ cheapest }) => (cheapest ? getVariantOrderLimit(cheapest.id, pickupPointId, collectionDate) : Promise.resolve(null)))),
      ])
    : [cheapestByProduct.map(() => null), cheapestByProduct.map(() => null)];

  return cheapestByProduct.map(({ product, cheapest }, index) => {
    const image = product.images.find((i) => i.is_primary) ?? product.images[0];
    const orderLimit = orderLimits[index];
    return {
      product,
      imagePath: image?.storage_path ?? null,
      priceCents: cheapest?.price_cents ?? null,
      availability: availabilities[index],
      maxQuantity: orderLimit?.isAvailable ? orderLimit.maxQuantity : null,
      variant: cheapest ? { id: cheapest.id, name: cheapest.name, priceCents: cheapest.price_cents! } : null,
    };
  });
}
