-- Fuerza Habitual (Documento funcional §7) necesita al menos un producto
-- curado como "subscribable" para que /plan-de-pan/membresias muestre algo:
-- ninguna variante lo tenía marcado todavía (el toggle en
-- /admin/suscripciones/planes es una decisión del obrador, así que no se
-- activó nada por defecto al sembrar el catálogo real). Sin esto la pantalla
-- de membresías se veía vacía y parecía que la suscripción no estaba
-- implementada.
--
-- Se curan los 4 panes diarios (Documento §3: "de martes a sábado, todos los
-- días") como punto de partida razonable para una suscripción semanal de
-- pan -- el resto del catálogo se puede activar en cualquier momento desde
-- /admin/suscripciones/planes, sin tocar código.

update public.product_variants
set subscribable = true
where product_id in (
  select id from public.products
  where slug in ('rustico-fuerza', 'chapata', 'semillas-fuerza', 'integral')
);
