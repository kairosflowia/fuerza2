-- Bug real encontrado por los tests: dentro de una misma transacción,
-- now() (transaction_timestamp()) devuelve el mismo valor para todas las
-- llamadas -- así que dos o más movimientos registrados en la misma
-- transacción comparten exactamente el mismo created_at. La función
-- variant_stock_timeline() desempataba con el id (uuid aleatorio), que no
-- tiene ninguna relación con el orden real de inserción, así que el cálculo
-- de stock_before/stock_after podía asignarse a la fila equivocada.
--
-- Se añade una columna estrictamente monótona (bigserial) para desempatar
-- por orden real de inserción, nunca por el uuid.

alter table public.product_stock_movements add column sequence_number bigserial;
create index product_stock_movements_variant_sequence_idx on public.product_stock_movements(product_variant_id, sequence_number);

create or replace function public.variant_stock_timeline(p_variant_id uuid, p_limit integer default 30)
returns table(
  occurred_at timestamptz,
  type text,
  category text,
  quantity integer,
  stock_before integer,
  stock_after integer,
  order_id uuid,
  notes text,
  actor_name text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  with stock_rows as (
    select
      psm.created_at as occurred_at,
      psm.type::text as type,
      'stock'::text as category,
      psm.quantity,
      (sum(psm.quantity) over (order by psm.sequence_number) - psm.quantity)::integer as stock_before,
      sum(psm.quantity) over (order by psm.sequence_number)::integer as stock_after,
      psm.order_id,
      psm.notes,
      coalesce(pr.full_name, 'Sistema') as actor_name
    from public.product_stock_movements psm
    left join public.profiles pr on pr.id = psm.created_by
    where psm.product_variant_id = p_variant_id
  ),
  reservation_rows as (
    select
      sr.created_at as occurred_at,
      'reserva'::text as type,
      'reservation'::text as category,
      sr.quantity,
      null::integer as stock_before,
      null::integer as stock_after,
      sr.order_id,
      'Reserva de checkout'::text as notes,
      'Sistema'::text as actor_name
    from public.stock_reservations sr
    where sr.product_variant_id = p_variant_id
    union all
    select
      sr.updated_at,
      'liberacion'::text,
      'reservation'::text,
      -sr.quantity,
      null::integer,
      null::integer,
      sr.order_id,
      case sr.status when 'expired' then 'Reserva expirada' else 'Reserva liberada' end,
      'Sistema'::text
    from public.stock_reservations sr
    where sr.product_variant_id = p_variant_id and sr.status in ('released', 'expired')
  )
  select * from (
    select * from stock_rows
    union all
    select * from reservation_rows
  ) combined
  order by occurred_at desc
  limit p_limit;
end;
$$;
revoke all on function public.variant_stock_timeline(uuid, integer) from public;
grant execute on function public.variant_stock_timeline(uuid, integer) to authenticated;
