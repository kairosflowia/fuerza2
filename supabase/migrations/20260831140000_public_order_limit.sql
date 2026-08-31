-- check_variant_availability() oculta a propósito la cantidad exacta
-- restante salvo que ya esté en "low_stock" (Documento 06 §11: nunca exponer
-- capacidad real como dato de marketing). Eso está bien para el texto "quedan
-- pocas unidades", pero dejaba sin límite real el stepper de la cesta
-- mientras el stock no bajara del umbral -- con 4 unidades de verdad en
-- stock y un umbral de 3, un cliente podía añadir 20 a la cesta sin ningún
-- aviso hasta fallar el pago. Este RPC nuevo expone el límite exacto de
-- unidades que se pueden pedir (no el "quedan poco" de marketing), para que
-- la cesta pueda limitar el stepper de verdad. No sustituye a
-- check_variant_availability; se usa solo para capar cantidad.
create or replace function public.check_variant_order_limit(
  p_product_variant_id uuid,
  p_pickup_point_id uuid,
  p_collection_date date
)
returns table(is_available boolean, reason text, max_quantity integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_availability record;
begin
  perform public.expire_stock_reservations();
  select * into v_availability from app_private.variant_availability(p_product_variant_id, p_pickup_point_id, p_collection_date);
  if not v_availability.is_available then
    return query select false, v_availability.reason, 0; return;
  end if;
  return query select true, 'available'::text, v_availability.remaining;
end;
$$;
revoke all on function public.check_variant_order_limit(uuid, uuid, date) from public;
grant execute on function public.check_variant_order_limit(uuid, uuid, date) to anon, authenticated;
