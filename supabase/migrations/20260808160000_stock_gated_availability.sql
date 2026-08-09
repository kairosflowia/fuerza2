-- El cliente pide que un producto con seguimiento de inventario (congelados y
-- envasados: pan de guayaba y queso, pan de molde con queso, mojicones,
-- empanadas colombianas, coxinhas — ver 20260808130000_inventory_stock_control.sql)
-- no pueda reservarse cuando no queda estoque, y que se avise cuando quedan
-- pocas unidades.
--
-- Hoy app_private.variant_availability() calcula la disponibilidad de TODA
-- variante contra production_dates (capacidad de horneado por fecha). Para
-- una variante con stock_tracking=true eso es incorrecto por partida doble:
-- (a) no se hornea para una fecha concreta, se vende de un lote ya elaborado,
-- así que exigir una fila production_dates 'open' para cada fecha la deja
-- permanentemente no reservable aunque haya estoque; (b) aunque existiera esa
-- fila, el número que importa es product_variants.stock_quantity, no una
-- capacidad de producción diaria.
--
-- Esta migración sustituye, solo para variantes con stock_tracking=true, el
-- cálculo de "remaining" basado en production_dates por uno basado en
-- stock_quantity menos lo ya vendido (order_items confirmados) y lo reservado
-- temporalmente (stock_reservations activas) — sumado en TODAS las fechas,
-- porque es un mismo lote físico compartido entre fechas de recogida, no una
-- capacidad que se reinicia cada día. El resto de reglas (cierre global,
-- corte de 48h, capacidad del punto de recogida, día de la semana en que se
-- vende) se mantienen sin cambios y se aplican igual a estas variantes.
--
-- check_variant_availability() (misma migración de origen) ya sabe convertir
-- un "remaining" bajo en el estado público 'low_stock' usando
-- 'availability.low_stock_threshold' (por defecto 5 si no está configurado);
-- aquí se fija explícitamente a 3, como pide el cliente ("últimas 3
-- unidades").

create or replace function app_private.variant_availability(
  p_product_variant_id uuid,
  p_pickup_point_id uuid,
  p_collection_date date
)
returns table(is_available boolean, reason text, remaining integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_product_status public.product_status;
  v_product_id uuid;
  v_variant_status public.variant_status;
  v_stock_tracking boolean;
  v_stock_quantity integer;
  v_point_status public.pickup_point_status;
  v_accepts_all boolean;
  v_product_allowed boolean;
  v_produced_that_day boolean;
  v_production public.production_dates;
  v_weekday smallint := extract(isodow from p_collection_date);
  v_cutoff_time time;
  v_cutoff_days_before integer;
  v_timezone text;
  v_cutoff_instant timestamptz;
  v_point_capacity record;
  v_point_consumed integer;
  v_point_remaining integer;
  v_variant_consumed integer;
  v_raw_remaining integer;
  v_allocations integer;
  v_variant_remaining integer;
  v_override_capacity integer;
  v_override_consumed integer;
  v_effective_remaining integer;
begin
  select p.status, p.id, pv.status, pv.stock_tracking, pv.stock_quantity
    into v_product_status, v_product_id, v_variant_status, v_stock_tracking, v_stock_quantity
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = p_product_variant_id;

  if not found then
    return query select false, 'variant_inactive', 0; return;
  end if;
  if v_product_status not in ('active', 'seasonal') then
    return query select false, 'product_unavailable', 0; return;
  end if;
  if v_variant_status <> 'active' then
    return query select false, 'variant_inactive', 0; return;
  end if;

  select status, accepts_all_products into v_point_status, v_accepts_all
    from public.pickup_points where id = p_pickup_point_id;
  if not found or v_point_status <> 'active' then
    return query select false, 'point_inactive', 0; return;
  end if;

  if not v_accepts_all then
    select exists(
      select 1 from public.product_pickup_points ppp
      where ppp.product_id = v_product_id and ppp.pickup_point_id = p_pickup_point_id and ppp.is_available
    ) into v_product_allowed;
    if not v_product_allowed then
      return query select false, 'product_not_allowed_at_point', 0; return;
    end if;
  end if;

  if exists (select 1 from public.global_closures where p_collection_date between starts_on and ends_on) then
    return query select false, 'global_closure', 0; return;
  end if;

  if exists (
    select 1 from public.pickup_point_exceptions
    where pickup_point_id = p_pickup_point_id and exception_date = p_collection_date and type = 'closed'
  ) then
    return query select false, 'point_closed', 0; return;
  end if;

  select exists(
    select 1 from public.product_production_weekdays
    where product_id = v_product_id and weekday = v_weekday and is_active
  ) into v_produced_that_day;
  if not v_produced_that_day then
    return query select false, 'not_produced_that_day', 0; return;
  end if;

  if not v_stock_tracking then
    select * into v_production from public.production_dates
      where product_variant_id = p_product_variant_id and production_date = p_collection_date;
    if not found or v_production.status <> 'open' then
      return query select false, 'production_not_open', 0; return;
    end if;
  end if;

  select (value #>> '{}')::time into v_cutoff_time from public.app_settings where key = 'availability.cutoff_time';
  select (value #>> '{}')::integer into v_cutoff_days_before from public.app_settings where key = 'availability.cutoff_days_before';
  select (value #>> '{}') into v_timezone from public.app_settings where key = 'operational.timezone';

  if v_cutoff_time is null or v_cutoff_days_before is null then
    -- Sin configurar todavía: por seguridad se trata como ya cerrado, nunca
    -- como sin restricción. Ver Documento 02 §5.5 y Documento 06 sección 5.
    return query select false, 'cutoff_passed', 0; return;
  end if;

  v_timezone := coalesce(v_timezone, 'Europe/Madrid');
  v_cutoff_instant := ((p_collection_date - v_cutoff_days_before)::text || ' ' || v_cutoff_time::text)::timestamp at time zone v_timezone;
  if now() >= v_cutoff_instant then
    return query select false, 'cutoff_passed', 0; return;
  end if;

  select * into v_point_capacity from app_private.pickup_point_capacity_for_date(p_pickup_point_id, p_collection_date);
  if not v_point_capacity.has_window then
    return query select false, 'no_collection_window', 0; return;
  end if;
  if not v_point_capacity.configured then
    return query select false, 'point_capacity_not_configured', 0; return;
  end if;

  select coalesce(sum(oi.quantity), 0) into v_point_consumed
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.pickup_point_id = p_pickup_point_id
      and o.collection_date = p_collection_date
      and o.status = 'confirmed';
  select v_point_consumed + coalesce(sum(sr.quantity), 0) into v_point_consumed
    from public.stock_reservations sr
    where sr.pickup_point_id = p_pickup_point_id
      and sr.collection_date = p_collection_date
      and sr.status = 'active'
      and sr.expires_at > now();

  v_point_remaining := greatest(v_point_capacity.capacity - v_point_consumed, 0);
  if v_point_remaining <= 0 then
    return query select false, 'point_full', 0; return;
  end if;

  if v_stock_tracking then
    -- Estoque físico compartido entre fechas de recogida: se descuenta lo
    -- vendido/reservado en cualquier fecha, no solo p_collection_date.
    select coalesce(sum(oi.quantity), 0) into v_variant_consumed
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_variant_id = p_product_variant_id
        and o.status = 'confirmed';
    select v_variant_consumed + coalesce(sum(sr.quantity), 0) into v_variant_consumed
      from public.stock_reservations sr
      where sr.product_variant_id = p_product_variant_id
        and sr.status = 'active'
        and sr.expires_at > now();

    v_variant_remaining := greatest(v_stock_quantity - v_variant_consumed, 0);
    if v_variant_remaining <= 0 then
      return query select false, 'out_of_stock', 0; return;
    end if;
  else
    select coalesce(sum(oi.quantity), 0) into v_variant_consumed
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_variant_id = p_product_variant_id
        and o.collection_date = p_collection_date
        and o.status = 'confirmed';
    select v_variant_consumed + coalesce(sum(sr.quantity), 0) into v_variant_consumed
      from public.stock_reservations sr
      where sr.product_variant_id = p_product_variant_id
        and sr.collection_date = p_collection_date
        and sr.status = 'active'
        and sr.expires_at > now();

    select coalesce(sum(quantity), 0) into v_allocations
      from public.subscription_capacity_allocations
      where product_variant_id = p_product_variant_id and allocation_date = p_collection_date;

    v_raw_remaining := greatest(v_production.total_capacity - v_variant_consumed, 0);
    v_variant_remaining := greatest(v_production.total_capacity - v_production.reserved_for_subscriptions - v_allocations - v_variant_consumed, 0);

    if v_variant_remaining <= 0 then
      if v_raw_remaining > 0 then
        return query select false, 'subscription_capacity_only', 0; return;
      else
        return query select false, 'sold_out', 0; return;
      end if;
    end if;
  end if;

  select capacity_override into v_override_capacity
    from public.availability_overrides
    where product_variant_id = p_product_variant_id
      and (pickup_point_id = p_pickup_point_id or pickup_point_id is null)
      and availability_date = p_collection_date
    order by pickup_point_id nulls last
    limit 1;

  if v_override_capacity is not null then
    select coalesce(sum(oi.quantity), 0) into v_override_consumed
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_variant_id = p_product_variant_id
        and o.pickup_point_id = p_pickup_point_id
        and o.collection_date = p_collection_date
        and o.status = 'confirmed';
    select v_override_consumed + coalesce(sum(sr.quantity), 0) into v_override_consumed
      from public.stock_reservations sr
      where sr.product_variant_id = p_product_variant_id
        and sr.pickup_point_id = p_pickup_point_id
        and sr.collection_date = p_collection_date
        and sr.status = 'active'
        and sr.expires_at > now();

    v_effective_remaining := least(v_variant_remaining, v_point_remaining, greatest(v_override_capacity - v_override_consumed, 0));
  else
    v_effective_remaining := least(v_variant_remaining, v_point_remaining);
  end if;

  if v_effective_remaining <= 0 then
    return query select false, 'sold_out', 0; return;
  end if;

  return query select true, 'available', v_effective_remaining;
end;
$$;

insert into public.app_settings (key, value, description, is_public)
values ('availability.low_stock_threshold', '3'::jsonb, 'A partir de cuántas unidades restantes check_variant_availability() marca una variante como low_stock (aviso de "últimas unidades").', true)
on conflict (key) do nothing;
