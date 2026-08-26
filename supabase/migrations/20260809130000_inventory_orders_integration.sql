-- Fase A del plan "inventario totalmente interligado con productos, ventas,
-- pedidos y producción" (spec del cliente, 2026-08-26). El motor de
-- reservas/ventas/cancelaciones ya existe y funciona correctamente
-- (stock_reservations, product_stock_movements, create_checkout_order,
-- process_payment_event) -- lo que falta es (1) un tipo de movimiento propio
-- para "producción terminada" distinto de la "entrada" genérica, (2) un
-- stock mínimo por variante en vez de solo el ajuste global, y (3) exponer
-- reservado/disponible/línea de tiempo/alertas, que hoy solo se pueden
-- calcular a mano consultando varias tablas.

alter table public.product_variants
  add column low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0);
comment on column public.product_variants.low_stock_threshold is 'Umbral de "stock bajo" propio de la variante. NULL = usa el ajuste global availability.low_stock_threshold.';

alter type public.stock_movement_type add value if not exists 'produccion';

-- register_stock_movement(): 'produccion' sigue la misma regla de signo que
-- 'entrada' (una producción terminada siempre suma stock). Firma sin
-- cambios -- solo se amplía la validación interna.
create or replace function public.register_stock_movement(
  p_product_variant_id uuid,
  p_type public.stock_movement_type,
  p_quantity integer,
  p_notes text default null
)
returns public.product_stock_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.product_stock_movements;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if p_type in ('venta', 'devolucion') then
    raise exception 'movement_type_reserved_for_system' using errcode = '42501';
  end if;

  if p_quantity = 0 then
    raise exception 'quantity_must_not_be_zero' using errcode = '23514';
  end if;

  if p_type in ('entrada', 'produccion') and p_quantity < 0 then
    raise exception 'entrada_requires_positive_quantity' using errcode = '23514';
  elsif p_type = 'merma' and p_quantity > 0 then
    raise exception 'merma_requires_negative_quantity' using errcode = '23514';
  end if;

  insert into public.product_stock_movements (product_variant_id, type, quantity, notes, created_by)
  values (p_product_variant_id, p_type, p_quantity, p_notes, (select auth.uid()))
  returning * into v_result;

  return v_result;
end;
$$;
revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, integer, text) from public;
grant execute on function public.register_stock_movement(uuid, public.stock_movement_type, integer, text) to authenticated;

-- Fuente de verdad para "reservado"/"disponible": nunca se materializan en
-- product_variants, siempre se computan en vivo a partir de
-- stock_reservations (igual que ya hace app_private.variant_availability()
-- para el motor de checkout -- aquí es la vista para el panel admin).
create or replace function public.variant_stock_status(p_product_id uuid default null)
returns table(
  variant_id uuid,
  product_id uuid,
  product_name text,
  variant_name text,
  stock_tracking boolean,
  stock_quantity integer,
  reserved_quantity integer,
  available_quantity integer,
  low_stock_threshold integer,
  stock_state text,
  last_movement_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_global_threshold integer;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select (value #>> '{}')::integer into v_global_threshold from public.app_settings where key = 'availability.low_stock_threshold';
  v_global_threshold := coalesce(v_global_threshold, 3);

  return query
  select
    pv.id,
    pv.product_id,
    p.name,
    pv.name,
    pv.stock_tracking,
    pv.stock_quantity,
    coalesce(r.reserved, 0)::integer,
    greatest(pv.stock_quantity - coalesce(r.reserved, 0), 0)::integer,
    coalesce(pv.low_stock_threshold, v_global_threshold),
    case
      when not pv.stock_tracking then 'no_controlado'
      when greatest(pv.stock_quantity - coalesce(r.reserved, 0), 0) <= 0 then 'agotado'
      when greatest(pv.stock_quantity - coalesce(r.reserved, 0), 0) <= coalesce(pv.low_stock_threshold, v_global_threshold) then 'stock_bajo'
      else 'disponible'
    end,
    m.last_at
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  left join lateral (
    select sum(sr.quantity)::integer as reserved
    from public.stock_reservations sr
    where sr.product_variant_id = pv.id and sr.status = 'active' and sr.expires_at > now()
  ) r on true
  left join lateral (
    select max(psm.created_at) as last_at
    from public.product_stock_movements psm
    where psm.product_variant_id = pv.id
  ) m on true
  where p_product_id is null or pv.product_id = p_product_id
  order by p.name, pv.name;
end;
$$;
revoke all on function public.variant_stock_status(uuid) from public;
grant execute on function public.variant_stock_status(uuid) to authenticated;

-- Línea de tiempo unificada para "Ver movimientos": une el ledger físico
-- (product_stock_movements) con los eventos de reserva (stock_reservations),
-- sin mezclar sus datos -- las filas de reserva nunca tocan
-- stock_before/stock_after porque una reserva nunca cambia el stock físico,
-- solo reduce lo "disponible" mientras está activa.
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
      (sum(psm.quantity) over (order by psm.created_at, psm.id) - psm.quantity)::integer as stock_before,
      sum(psm.quantity) over (order by psm.created_at, psm.id)::integer as stock_after,
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

-- Alertas de inventario para el dashboard (/admin). Se mantiene separada de
-- get_business_analytics() a propósito -- es una función pequeña y aditiva,
-- no toca el analytics ya probado.
create or replace function public.inventory_dashboard_alerts()
returns table(
  out_of_stock_count integer,
  low_stock_count integer,
  expiring_reservations_count integer,
  recent_mermas_count integer,
  pending_orders_count integer,
  paid_pending_prep_count integer
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
  select
    (select count(*)::integer from public.variant_stock_status() where stock_state = 'agotado'),
    (select count(*)::integer from public.variant_stock_status() where stock_state = 'stock_bajo'),
    (select count(*)::integer from public.stock_reservations where status = 'active' and expires_at between now() and now() + interval '30 minutes'),
    (select count(*)::integer from public.product_stock_movements where type = 'merma' and created_at > now() - interval '24 hours'),
    (select count(*)::integer from public.orders where status = 'pending_payment'),
    (select count(*)::integer from public.orders where payment_status = 'paid' and status = 'confirmed');
end;
$$;
revoke all on function public.inventory_dashboard_alerts() from public;
grant execute on function public.inventory_dashboard_alerts() to authenticated;
