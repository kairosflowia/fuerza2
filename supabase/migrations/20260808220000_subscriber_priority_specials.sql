-- Documento funcional del cliente, sección 7: "Fuerza Habitual... prioridad
-- para especiales." Quedó pendiente deliberadamente en
-- 20260808210000_fuerza_habitual_redesign.sql (ver su informe de cierre):
-- ese cambio ya era muy grande y esto necesitaba diseño propio.
--
-- Interpretación elegida: quien tiene una suscripción Fuerza Habitual activa
-- puede reservar el "Especial de la semana" (weekly_specials) en cuanto el
-- obrador lo cura, sin esperar a nada más que el corte normal de 48h. El
-- público general solo puede reservarlo a partir de una ventana más corta
-- antes de ese mismo corte -- por defecto 48h antes del corte, es decir, un
-- especial que abre el sábado normalmente solo se libera al público unas 96h
-- antes de la recogida, mientras que un cliente con Fuerza Habitual puede
-- reservarlo desde antes.
--
-- No hace falta ninguna reserva de capacidad separada para lograrlo (a
-- diferencia de subscription_capacity_allocations, que reserva CANTIDAD):
-- aquí basta con retrasar cuándo se ABRE la reserva para quien no es
-- suscriptor, usando el mismo tipo de instante de corte que ya existe para
-- el cierre de reservas.

insert into public.app_settings (key, value, description, is_public)
values ('availability.subscriber_priority_hours', '48'::jsonb, 'Horas de antelación extra con las que un suscriptor de Fuerza Habitual activo puede reservar el Especial de la semana, antes de que se abra al público general (Documento funcional §7).', true)
on conflict (key) do nothing;

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
  v_is_weekly_special boolean;
  v_priority_hours integer;
  v_release_instant timestamptz;
  v_is_priority_caller boolean;
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

  -- Prioridad de Fuerza Habitual para el Especial de la semana (Documento
  -- funcional §7): quien no es suscriptor activo ni personal del obrador
  -- solo puede reservar a partir de una ventana más corta antes del corte.
  select exists(
    select 1 from public.weekly_specials
    where product_id = v_product_id and collection_date = p_collection_date
  ) into v_is_weekly_special;

  if v_is_weekly_special then
    v_is_priority_caller := app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator');
    if not v_is_priority_caller and auth.uid() is not null then
      select exists(
        select 1 from public.subscriptions
        where customer_id = auth.uid() and status in ('active', 'trialing')
      ) into v_is_priority_caller;
    end if;

    if not coalesce(v_is_priority_caller, false) then
      select (value #>> '{}')::integer into v_priority_hours from public.app_settings where key = 'availability.subscriber_priority_hours';
      v_release_instant := v_cutoff_instant - make_interval(hours => coalesce(v_priority_hours, 48));
      if now() < v_release_instant then
        return query select false, 'reserved_for_subscribers', 0; return;
      end if;
    end if;
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
    -- product_variants.stock_quantity ya refleja toda venta confirmada (el
    -- trigger app_private.apply_stock_movement() la descuenta en cuanto se
    -- inserta el movimiento 'venta'). Aquí solo se resta lo reservado
    -- TEMPORALMENTE: un checkout en curso que aún no se confirmó y por eso
    -- aún no generó ese movimiento. Sumar también los order_items
    -- confirmados descontaría la misma venta dos veces.
    select coalesce(sum(sr.quantity), 0) into v_variant_consumed
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
