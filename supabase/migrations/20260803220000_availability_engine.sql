-- Fase 6: motor real de disponibilidad por producto, variante, fecha y punto
-- de recogida. Protege el invariante central: el sistema nunca vende más de
-- lo que puede producir ni más de lo que un punto puede entregar.
--
-- No implementa: carrito completo, checkout completo, Stripe, pagos, emails,
-- suscripciones funcionales ni el panel de producción final. Las funciones de
-- conversión y cancelación son infraestructura para tests, no un flujo
-- público funcional.

-- ---------------------------------------------------------------------------
-- 1. Tipos
-- ---------------------------------------------------------------------------

create type public.production_date_status as enum ('draft', 'open', 'closed', 'cancelled');
create type public.stock_reservation_status as enum ('active', 'expired', 'released', 'converted');
create type public.order_status as enum ('pending_payment', 'confirmed', 'cancelled', 'refunded');

-- ---------------------------------------------------------------------------
-- 2. production_dates — configuración de producción por variante y fecha.
--    Es la fuente de verdad de la capacidad productiva. No se mantienen
--    contadores desnormalizados: la disponibilidad se calcula agregando
--    stock_reservations, order_items y subscription_capacity_allocations en
--    el momento, dentro de la misma transacción que la reserva (Documento 04
--    §2.5 y §7.1: la disponibilidad se calcula siempre en el servidor).
-- ---------------------------------------------------------------------------

create table public.production_dates (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  production_date date not null,
  total_capacity integer not null check (total_capacity >= 0),
  reserved_for_subscriptions integer not null default 0 check (reserved_for_subscriptions >= 0),
  status public.production_date_status not null default 'draft',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reserved_not_exceeding_total check (reserved_for_subscriptions <= total_capacity),
  unique (product_variant_id, production_date)
);
comment on table public.production_dates is 'Capacidad productiva por variante y fecha. No hay contadores desnormalizados: la disponibilidad se agrega en el momento a partir de stock_reservations, order_items y subscription_capacity_allocations.';
create index production_dates_date_idx on public.production_dates(production_date);
create index production_dates_status_idx on public.production_dates(status);

-- Ninguna reducción de capacidad puede dejar el total por debajo de lo ya
-- comprometido (confirmado + reservado temporalmente + reservado para
-- suscripciones + asignado a suscripciones).
create or replace function app_private.validate_production_date_capacity_reduction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_committed integer;
begin
  if new.total_capacity < old.total_capacity or new.reserved_for_subscriptions < old.reserved_for_subscriptions then
    select coalesce(sum(oi.quantity), 0) into v_committed
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_variant_id = new.product_variant_id
        and o.collection_date = new.production_date
        and o.status = 'confirmed';

    select v_committed + coalesce(sum(sr.quantity), 0) into v_committed
      from public.stock_reservations sr
      where sr.product_variant_id = new.product_variant_id
        and sr.collection_date = new.production_date
        and sr.status = 'active'
        and sr.expires_at > now();

    select v_committed + new.reserved_for_subscriptions + coalesce(sum(a.quantity), 0) into v_committed
      from public.subscription_capacity_allocations a
      where a.product_variant_id = new.product_variant_id
        and a.allocation_date = new.production_date;

    if new.total_capacity < v_committed then
      raise exception 'capacity_below_committed' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger production_dates_validate_capacity
before update on public.production_dates
for each row execute function app_private.validate_production_date_capacity_reduction();

create trigger production_dates_updated_at
before update on public.production_dates
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. availability_overrides — excepción de capacidad para la intersección
--    variante × punto × fecha, que ni production_dates (variante × fecha,
--    sin dimensión de punto) ni la capacidad del punto de la Fase 5 (punto ×
--    fecha, sin dimensión de variante) pueden expresar. Se usa solo cuando
--    hace falta limitar una variante concreta en un punto concreto por
--    debajo de lo que la producción y el punto permitirían en general (por
--    ejemplo: a un punto pequeño solo le cabe la mitad de una hornada). Si
--    pickup_point_id es nulo, el límite se aplica a la variante en esa fecha
--    en cualquier punto, como excepción puntual sin tocar el valor estable
--    de production_dates.total_capacity.
-- ---------------------------------------------------------------------------

create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  pickup_point_id uuid references public.pickup_points(id) on delete cascade,
  availability_date date not null,
  capacity_override integer not null check (capacity_override >= 0),
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_variant_id, pickup_point_id, availability_date)
);
comment on table public.availability_overrides is 'Excepción puntual para la celda variante×punto×fecha. No duplica production_dates ni la capacidad del punto: solo se usa cuando esa intersección concreta necesita un límite distinto.';
create unique index availability_overrides_point_null_idx on public.availability_overrides(product_variant_id, availability_date) where pickup_point_id is null;
create index availability_overrides_lookup_idx on public.availability_overrides(product_variant_id, availability_date);

create trigger availability_overrides_updated_at
before update on public.availability_overrides
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. stock_reservations — reserva temporal. Sin conteos denormalizados: la
--    protección contra sobreventa se hace con bloqueos advisory transaccionales
--    (sección 9) más recomputación dentro de la misma transacción, porque no
--    existe una única fila que pueda incrementarse atómicamente para la
--    dimensión "capacidad del punto" (esa capacidad es derivada por reglas,
--    no una fila materializada).
-- ---------------------------------------------------------------------------

create table public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  session_key text not null,
  customer_id uuid references auth.users(id) on delete set null,
  product_variant_id uuid not null references public.product_variants(id) on delete restrict,
  pickup_point_id uuid not null references public.pickup_points(id) on delete restrict,
  collection_date date not null,
  quantity integer not null check (quantity > 0),
  status public.stock_reservation_status not null default 'active',
  expires_at timestamptz not null,
  extended_at timestamptz,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.stock_reservations is 'Sin acceso directo de escritura para ningún rol: toda mutación pasa por las funciones transaccionales de esta migración, que es lo único que garantiza el invariante de no sobreventa.';
create index stock_reservations_variant_date_idx on public.stock_reservations(product_variant_id, collection_date) where status = 'active';
create index stock_reservations_point_date_idx on public.stock_reservations(pickup_point_id, collection_date) where status = 'active';
create index stock_reservations_expiry_idx on public.stock_reservations(expires_at) where status = 'active';
create index stock_reservations_customer_idx on public.stock_reservations(customer_id);

create trigger stock_reservations_updated_at
before update on public.stock_reservations
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. orders / order_items — estructura mínima para contabilizar encomiendas
--    confirmadas. Sin flujo comercial completo: nace de convert_reservation_to_order.
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  guest_email text,
  guest_phone text,
  pickup_point_id uuid not null references public.pickup_points(id) on delete restrict,
  collection_date date not null,
  status public.order_status not null default 'pending_payment',
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'EUR',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.orders is 'Estructura mínima de esta fase. Sin Stripe, sin checkout público: nace únicamente de convert_reservation_to_order, usada en tests e infraestructura.';
create index orders_point_date_status_idx on public.orders(pickup_point_id, collection_date, status);
create index orders_customer_idx on public.orders(customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);
comment on table public.order_items is 'Snapshot inmutable de nombre y precio en el momento de la confirmación. Un cambio de precio o de nombre del producto nunca altera un pedido ya existente.';
create index order_items_order_idx on public.order_items(order_id);
create index order_items_variant_idx on public.order_items(product_variant_id);

create or replace function app_private.forbid_order_item_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'order_items_immutable' using errcode = '0A000';
end;
$$;

create trigger order_items_forbid_update
before update on public.order_items
for each row execute function app_private.forbid_order_item_update();

create trigger orders_updated_at
before update on public.orders
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. subscription_capacity_allocations — capacidad ya comprometida para
--    Plan de Pan, mucho antes de que las suscripciones sean funcionales.
-- ---------------------------------------------------------------------------

create table public.subscription_capacity_allocations (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  pickup_point_id uuid references public.pickup_points(id) on delete set null,
  allocation_date date not null,
  quantity integer not null check (quantity > 0),
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.subscription_capacity_allocations is 'Ledger de capacidad reservada para suscripciones. No crea suscripciones funcionales: es la pieza que permite que la Fase de Plan de Pan reserve stock antes de la venta suelta sin rediseñar el motor.';
create index subscription_capacity_allocations_lookup_idx on public.subscription_capacity_allocations(product_variant_id, allocation_date);

create trigger subscription_capacity_allocations_updated_at
before update on public.subscription_capacity_allocations
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Auditoría de las tablas de esta fase, reutilizando la función genérica
--    ya existente. Las lecturas de disponibilidad no generan auditoría (solo
--    las funciones transaccionales insertan explícitamente en audit_logs).
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'production_dates',
    'availability_overrides',
    'subscription_capacity_allocations'
  ]
  loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function app_private.audit_catalog_change()', t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Cálculo de capacidad del punto para una fecha (Fase 5, reimplementado
--    en SQL porque el motor transaccional no puede llamar a TypeScript). El
--    dominio TypeScript de la Fase 5 sigue siendo la fuente para el
--    calendario administrativo y la página pública de puntos; esta función
--    es la única fuente para el camino transaccional.
-- ---------------------------------------------------------------------------

create or replace function app_private.pickup_point_capacity_for_date(p_pickup_point_id uuid, p_date date)
returns table(capacity integer, configured boolean, has_window boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_weekday smallint := extract(isodow from p_date);
  v_exception_type public.pickup_exception_type;
  v_exception_capacity integer;
  v_exception_window_start time;
  v_has_window boolean;
  v_capacity integer;
  v_configured boolean;
begin
  select type, capacity_override, collection_starts_at
    into v_exception_type, v_exception_capacity, v_exception_window_start
    from public.pickup_point_exceptions
    where pickup_point_id = p_pickup_point_id and exception_date = p_date;

  if v_exception_type in ('extraordinary_opening', 'schedule_override') then
    v_has_window := v_exception_window_start is not null;
  else
    v_has_window := exists (
      select 1 from public.pickup_point_collection_windows
      where pickup_point_id = p_pickup_point_id and weekday = v_weekday and is_active
    );
  end if;

  if v_exception_type = 'capacity_override' then
    v_capacity := v_exception_capacity;
    v_configured := true;
  else
    select max_units into v_capacity
      from public.pickup_point_capacity_defaults
      where pickup_point_id = p_pickup_point_id and weekday = v_weekday;
    v_configured := found;
  end if;

  return query select v_capacity, v_configured, v_has_window;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Núcleo de disponibilidad: capacidad productiva restante, capacidad del
--    punto restante y el mínimo entre ambas, con los 15 códigos de motivo.
--    Función de solo lectura, reutilizada tanto por la consulta pública como
--    por la reserva transaccional (sección 10), para que exista una única
--    fuente de verdad del cálculo.
-- ---------------------------------------------------------------------------

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
  select p.status, p.id, pv.status
    into v_product_status, v_product_id, v_variant_status
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

  select * into v_production from public.production_dates
    where product_variant_id = p_product_variant_id and production_date = p_collection_date;
  if not found or v_production.status <> 'open' then
    return query select false, 'production_not_open', 0; return;
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

revoke all on function app_private.pickup_point_capacity_for_date(uuid, date) from public;
revoke all on function app_private.variant_availability(uuid, uuid, date) from public;

-- ---------------------------------------------------------------------------
-- 10. Reserva transaccional. Estrategia elegida: bloqueos advisory
--     transaccionales (pg_advisory_xact_lock), en un orden fijo (variante×
--     fecha primero, punto×fecha después) para excluir interbloqueos, más
--     recomputación completa dentro de la transacción bloqueada. Se prefiere
--     a un incremento atómico de contador porque la capacidad del punto no
--     es una fila materializada que se pueda bloquear o incrementar
--     directamente: se deriva de reglas (Fase 5). Serializable se descartó
--     por forzar reintentos de aplicación sin necesidad, cuando un bloqueo
--     advisory ya serializa exactamente la sección crítica que importa.
-- ---------------------------------------------------------------------------

create or replace function public.create_stock_reservation(
  p_product_variant_id uuid,
  p_pickup_point_id uuid,
  p_collection_date date,
  p_quantity integer,
  p_session_key text,
  p_customer_id uuid default null
)
returns table(ok boolean, reason text, reservation_id uuid, token text, expires_at timestamptz, quantity_available integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_availability record;
  v_reservation_seconds integer;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
begin
  if p_quantity is null or p_quantity <= 0 then
    return query select false, 'invalid_quantity', null::uuid, null::text, null::timestamptz, null::integer; return;
  end if;
  if p_session_key is null or length(trim(p_session_key)) = 0 then
    return query select false, 'invalid_session', null::uuid, null::text, null::timestamptz, null::integer; return;
  end if;

  -- Orden fijo de los dos bloqueos: siempre variante antes que punto.
  perform pg_advisory_xact_lock(1, hashtext(p_product_variant_id::text || p_collection_date::text));
  perform pg_advisory_xact_lock(2, hashtext(p_pickup_point_id::text || p_collection_date::text));

  -- Autocuración: expirar antes de calcular, sin depender de una tarea
  -- agendada para que el cálculo sea correcto en el momento. Delegado a
  -- expire_stock_reservations() porque "expires_at" es también un
  -- parámetro OUT de esta función y un UPDATE inline sobre esa columna es
  -- ambiguo en PL/pgSQL.
  perform public.expire_stock_reservations();

  select * into v_availability from app_private.variant_availability(p_product_variant_id, p_pickup_point_id, p_collection_date);

  if not v_availability.is_available then
    return query select false, v_availability.reason, null::uuid, null::text, null::timestamptz, greatest(v_availability.remaining, 0); return;
  end if;

  if p_quantity > v_availability.remaining then
    return query select false, 'sold_out', null::uuid, null::text, null::timestamptz, v_availability.remaining; return;
  end if;

  select (value #>> '{}')::integer into v_reservation_seconds from public.app_settings where key = 'availability.reservation_duration_seconds';
  v_reservation_seconds := coalesce(v_reservation_seconds, 900);

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + make_interval(secs => v_reservation_seconds);

  insert into public.stock_reservations (token, session_key, customer_id, product_variant_id, pickup_point_id, collection_date, quantity, status, expires_at)
  values (v_token, p_session_key, p_customer_id, p_product_variant_id, p_pickup_point_id, p_collection_date, p_quantity, 'active', v_expires)
  returning id into v_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  values (p_customer_id, 'reservation.created', 'stock_reservations', v_id::text, jsonb_build_object('quantity', p_quantity, 'collection_date', p_collection_date, 'pickup_point_id', p_pickup_point_id));

  return query select true, 'available', v_id, v_token, v_expires, v_availability.remaining - p_quantity;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Expiración. Idempotente, apta para cron y para llamada bajo demanda.
--     No es la corrección: es higiene. La corrección la da la
--     autocuración dentro de create_stock_reservation y variant_availability.
-- ---------------------------------------------------------------------------

create or replace function public.expire_stock_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.stock_reservations
    set status = 'expired'
    where status = 'active' and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. Prolongamiento. Como mucho una vez por reserva.
-- ---------------------------------------------------------------------------

create or replace function public.extend_stock_reservation(p_token text)
returns table(ok boolean, reason text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.stock_reservations;
  v_extension_seconds integer;
  v_new_expiry timestamptz;
begin
  select * into v_reservation from public.stock_reservations where token = p_token for update;

  if not found then
    return query select false, 'not_found', null::timestamptz; return;
  end if;
  if v_reservation.status <> 'active' then
    return query select false, 'not_active', null::timestamptz; return;
  end if;
  if v_reservation.expires_at < now() then
    update public.stock_reservations set status = 'expired' where id = v_reservation.id;
    return query select false, 'already_expired', null::timestamptz; return;
  end if;
  if v_reservation.extended_at is not null then
    return query select false, 'already_extended', v_reservation.expires_at; return;
  end if;

  select (value #>> '{}')::integer into v_extension_seconds from public.app_settings where key = 'availability.reservation_max_extension_seconds';
  v_extension_seconds := coalesce(v_extension_seconds, 300);
  v_new_expiry := v_reservation.expires_at + make_interval(secs => v_extension_seconds);

  update public.stock_reservations
    set expires_at = v_new_expiry, extended_at = now()
    where id = v_reservation.id;

  insert into public.audit_logs (action, entity_type, entity_id, new_data)
  values ('reservation.extended', 'stock_reservations', v_reservation.id::text, jsonb_build_object('new_expiry', v_new_expiry));

  return query select true, 'extended', v_new_expiry;
end;
$$;

-- ---------------------------------------------------------------------------
-- 13. Conversión en encomienda. Infraestructura y tests únicamente en esta
--     fase: sin Stripe, sin flujo público. Idempotente por token.
-- ---------------------------------------------------------------------------

create or replace function public.convert_reservation_to_order(
  p_token text,
  p_guest_email text default null,
  p_guest_phone text default null
)
returns table(ok boolean, reason text, order_id uuid, public_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.stock_reservations;
  v_variant public.product_variants;
  v_product public.products;
  v_order_id uuid;
  v_public_code text;
  v_line_total integer;
begin
  select * into v_reservation from public.stock_reservations where token = p_token for update;

  if not found then
    return query select false, 'not_found', null::uuid, null::text; return;
  end if;

  if v_reservation.status = 'converted' then
    select o.id, o.public_code into v_order_id, v_public_code
      from public.orders o where o.id = v_reservation.converted_order_id;
    return query select true, 'already_converted', v_order_id, v_public_code; return;
  end if;

  if v_reservation.status <> 'active' then
    return query select false, 'not_active', null::uuid, null::text; return;
  end if;
  if v_reservation.expires_at < now() then
    update public.stock_reservations set status = 'expired' where id = v_reservation.id;
    return query select false, 'expired', null::uuid, null::text; return;
  end if;

  select * into v_variant from public.product_variants where id = v_reservation.product_variant_id;
  select * into v_product from public.products where id = v_variant.product_id;

  v_line_total := coalesce(v_variant.price_cents, 0) * v_reservation.quantity;
  v_public_code := 'FZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (public_code, customer_id, guest_email, guest_phone, pickup_point_id, collection_date, status, total_cents, currency, confirmed_at)
  values (v_public_code, v_reservation.customer_id, p_guest_email, p_guest_phone, v_reservation.pickup_point_id, v_reservation.collection_date, 'confirmed', v_line_total, 'EUR', now())
  returning id into v_order_id;

  insert into public.order_items (order_id, product_variant_id, product_name_snapshot, variant_name_snapshot, unit_price_cents, quantity, line_total_cents)
  values (v_order_id, v_variant.id, v_product.name, v_variant.name, coalesce(v_variant.price_cents, 0), v_reservation.quantity, v_line_total);

  update public.stock_reservations
    set status = 'converted', converted_order_id = v_order_id
    where id = v_reservation.id;

  insert into public.audit_logs (action, entity_type, entity_id, new_data)
  values ('reservation.converted', 'orders', v_order_id::text, jsonb_build_object('reservation_id', v_reservation.id, 'public_code', v_public_code));

  return query select true, 'confirmed', v_order_id, v_public_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 14. Cancelación. Libera capacidad automáticamente: al pasar a 'cancelled',
--     el pedido deja de contar en las sumas de variant_availability. No
--     implementa política comercial de reembolso.
-- ---------------------------------------------------------------------------

create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return query select false, 'not_found'; return;
  end if;
  if v_order.status = 'cancelled' then
    return query select false, 'already_cancelled'; return;
  end if;
  if v_order.status = 'refunded' then
    return query select false, 'already_refunded'; return;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data, new_data, metadata)
  values ((select auth.uid()), 'order.cancelled', 'orders', p_order_id::text, jsonb_build_object('status', v_order.status), jsonb_build_object('status', 'cancelled'), jsonb_build_object('reason', p_reason));

  return query select true, 'cancelled';
end;
$$;

-- ---------------------------------------------------------------------------
-- 15. Cambio de estado operativo limitado para operator. No expone
--     total_capacity ni reserved_for_subscriptions: la firma de la función
--     no las acepta, así que no pueden alterarse por esta vía sea cual sea
--     el rol de quien llama.
-- ---------------------------------------------------------------------------

create or replace function public.set_production_date_status(p_id uuid, p_status public.production_date_status)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_operator_only boolean;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  v_is_operator_only := app_private.has_role('operator') and not (app_private.has_role('owner') or app_private.has_role('admin'));
  if v_is_operator_only and p_status not in ('open', 'closed') then
    return query select false, 'operator_status_limited'; return;
  end if;

  if not exists (select 1 from public.production_dates where id = p_id) then
    return query select false, 'not_found'; return;
  end if;

  update public.production_dates set status = p_status where id = p_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  values ((select auth.uid()), 'production_date.status_changed', 'production_dates', p_id::text, jsonb_build_object('status', p_status));

  return query select true, 'updated';
end;
$$;

-- ---------------------------------------------------------------------------
-- 16. Consultas públicas seguras de disponibilidad. Nunca exponen
--     total_capacity, reserved_for_subscriptions ni identificadores internos
--     innecesarios: solo status, reason y, opcionalmente, la cantidad
--     restante cuando ya es baja.
-- ---------------------------------------------------------------------------

create or replace function public.check_variant_availability(
  p_product_variant_id uuid,
  p_pickup_point_id uuid,
  p_collection_date date
)
returns table(status text, reason text, quantity_available integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_availability record;
  v_low_stock_threshold integer;
begin
  -- Autocuración: no depende de una tarea agendada para que el cálculo sea
  -- correcto en el momento. Delegado a expire_stock_reservations() (en vez
  -- de repetir el UPDATE aquí) porque "status" es también un parámetro OUT
  -- de esta función y un UPDATE inline sobre esa columna es ambiguo en
  -- PL/pgSQL.
  perform public.expire_stock_reservations();

  select * into v_availability from app_private.variant_availability(p_product_variant_id, p_pickup_point_id, p_collection_date);

  select (value #>> '{}')::integer into v_low_stock_threshold from public.app_settings where key = 'availability.low_stock_threshold';
  v_low_stock_threshold := coalesce(v_low_stock_threshold, 5);

  if not v_availability.is_available then
    return query select 'sold_out'::text, v_availability.reason, null::integer; return;
  end if;

  if v_availability.remaining <= v_low_stock_threshold then
    return query select 'low_stock'::text, 'available'::text, v_availability.remaining; return;
  end if;

  return query select 'available'::text, 'available'::text, null::integer;
end;
$$;

create or replace function public.next_available_date(
  p_product_variant_id uuid,
  p_pickup_point_id uuid,
  p_from_date date default current_date,
  p_horizon_days integer default 60
)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
  v_availability record;
begin
  perform public.expire_stock_reservations();

  for v_date in select generate_series(p_from_date, p_from_date + p_horizon_days, interval '1 day')::date loop
    select * into v_availability from app_private.variant_availability(p_product_variant_id, p_pickup_point_id, v_date);
    if v_availability.is_available then
      return v_date;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function public.available_pickup_points_for_variant(
  p_product_variant_id uuid,
  p_collection_date date
)
returns table(pickup_point_id uuid, status text, reason text, quantity_available integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
    select pp.id, c.status, c.reason, c.quantity_available
    from public.pickup_points pp
    cross join lateral public.check_variant_availability(p_product_variant_id, pp.id, p_collection_date) c
    where pp.is_public and pp.status in ('active', 'coming_soon');
end;
$$;

-- ---------------------------------------------------------------------------
-- 17. Concesiones de funciones. Revocado de public por defecto; concedido
--     explícitamente. Las funciones de mutación de reservas y pedidos NO se
--     conceden a anon en esta fase: la Fase 6 prepara la infraestructura,
--     pero "no crea reserva funcional pública todavía" (enunciado). Solo las
--     consultas de solo lectura son públicas.
-- ---------------------------------------------------------------------------

revoke all on function public.create_stock_reservation(uuid, uuid, date, integer, text, uuid) from public;
revoke all on function public.expire_stock_reservations() from public;
revoke all on function public.extend_stock_reservation(text) from public;
revoke all on function public.convert_reservation_to_order(text, text, text) from public;
revoke all on function public.cancel_order(uuid, text) from public;
revoke all on function public.set_production_date_status(uuid, public.production_date_status) from public;
revoke all on function public.check_variant_availability(uuid, uuid, date) from public;
revoke all on function public.next_available_date(uuid, uuid, date, integer) from public;
revoke all on function public.available_pickup_points_for_variant(uuid, date) from public;

grant execute on function public.create_stock_reservation(uuid, uuid, date, integer, text, uuid) to authenticated;
grant execute on function public.expire_stock_reservations() to authenticated;
grant execute on function public.extend_stock_reservation(text) to authenticated;
grant execute on function public.convert_reservation_to_order(text, text, text) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.set_production_date_status(uuid, public.production_date_status) to authenticated;
grant execute on function public.check_variant_availability(uuid, uuid, date) to anon, authenticated;
grant execute on function public.next_available_date(uuid, uuid, date, integer) to anon, authenticated;
grant execute on function public.available_pickup_points_for_variant(uuid, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 18. Row Level Security.
--
--     production_dates, availability_overrides, subscription_capacity_allocations:
--     RLS + concesión de tabla completa (select/insert/update/delete) a
--     authenticated, filtrado por política; operator solo lectura.
--
--     stock_reservations, orders, order_items: RLS habilitada pero SIN
--     concesión de insert/update/delete a ningún rol. Toda mutación pasa
--     exclusivamente por las funciones SECURITY DEFINER de arriba — es la
--     única forma de garantizar el invariante de no sobreventa sin
--     depender de que cada futura ruta de escritura respete las reglas.
-- ---------------------------------------------------------------------------

alter table public.production_dates enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.subscription_capacity_allocations enable row level security;
alter table public.stock_reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy production_dates_staff_read on public.production_dates
for select to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));

create policy production_dates_admin_manage on public.production_dates
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy availability_overrides_staff_read on public.availability_overrides
for select to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));

create policy availability_overrides_admin_manage on public.availability_overrides
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy subscription_allocations_staff_read on public.subscription_capacity_allocations
for select to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));

create policy subscription_allocations_admin_manage on public.subscription_capacity_allocations
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy stock_reservations_select on public.stock_reservations
for select to authenticated
using (
  customer_id = (select auth.uid())
  or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')
);

create policy orders_select on public.orders
for select to authenticated
using (
  customer_id = (select auth.uid())
  or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')
);

create policy order_items_select on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = (select auth.uid()) or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'))
  )
);

grant select, insert, update, delete on public.production_dates to authenticated;
grant select, insert, update, delete on public.availability_overrides to authenticated;
grant select, insert, update, delete on public.subscription_capacity_allocations to authenticated;
grant select on public.stock_reservations to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- ---------------------------------------------------------------------------
-- 19. Tarea agendada. service_role no tiene concesiones implícitas en este
--     proyecto (solo lo que se concede explícitamente, igual que cualquier
--     otro rol) — se concede aquí exactamente lo que la tarea de expiración y
--     reconciliación necesita, nada más.
-- ---------------------------------------------------------------------------

grant execute on function public.expire_stock_reservations() to service_role;
grant select on public.stock_reservations to service_role;
grant select on public.orders to service_role;
grant select on public.order_items to service_role;
grant select on public.production_dates to service_role;
