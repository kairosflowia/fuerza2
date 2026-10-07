-- Plan de Pan: varios días de recogida por plan y preferencias del cliente.
--
-- Hasta ahora una suscripción tenía UN día (subscriptions.preferred_weekday)
-- y cada periodo de facturación producía UNA entrega: create_subscription_basket()
-- calculaba una sola fecha, generate_subscription_cycles() avanzaba un único
-- paso por periodo y process_subscription_invoice() convertía cada factura
-- pagada en un único pedido. "Cada semana, lunes y jueves" no se podía
-- cumplir: Stripe habría cobrado una vez por semana y solo se habría
-- preparado una entrega.
--
-- Modelo nuevo (decidido con el negocio):
--   - Una suscripción = un plan = una suscripción de Stripe, una cobranza por
--     periodo (la frecuencia). El precio por periodo es la cesta × el número
--     de días elegidos.
--   - Cada periodo tiene una "semana de entrega": se entrega en TODOS los
--     días elegidos de esa semana. Con "cada 2 semanas, lunes y jueves" se
--     recibe lunes y jueves de semana sí, semana no.
--   - subscription_cycles sigue siendo una fila por entrega (fecha); los
--     ciclos de un mismo periodo comparten cycle_start = lunes de la semana
--     de entrega. Cada factura pagada crea un pedido por cada ciclo de ese
--     periodo.
--   - El 5% de descuento sigue contándose POR ENTREGA (4+ unidades en la
--     cesta de cada día), igual que antes.
--   - Preferencias del cliente guardadas en la suscripción y copiadas a la
--     nota interna de cada pedido generado, para que el equipo las vea al
--     preparar.

-- ---------------------------------------------------------------------------
-- 1. Columnas nuevas.
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  add column preferred_weekdays smallint[] not null default '{}',
  add column wants_new_breads boolean not null default false,
  add column allow_substitution boolean not null default false,
  add column customer_note text check (customer_note is null or char_length(customer_note) <= 500);

update public.subscriptions set preferred_weekdays = array[preferred_weekday]::smallint[];

-- Compatibilidad: quien todavía escriba solo preferred_weekday (inserciones
-- directas, la firma antigua) obtiene la lista de un día; y preferred_weekday
-- se mantiene siempre como el primer día de la lista.
create or replace function app_private.sync_subscription_weekdays()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.preferred_weekdays is null or cardinality(new.preferred_weekdays) = 0 then
    new.preferred_weekdays := array[new.preferred_weekday]::smallint[];
  else
    new.preferred_weekdays := array(select distinct x from unnest(new.preferred_weekdays) x order by x);
    new.preferred_weekday := new.preferred_weekdays[1];
  end if;
  return new;
end;
$$;

create trigger subscriptions_sync_weekdays
before insert or update of preferred_weekday, preferred_weekdays on public.subscriptions
for each row execute function app_private.sync_subscription_weekdays();

alter table public.subscriptions
  add constraint subscriptions_preferred_weekdays_valid
  check (cardinality(preferred_weekdays) between 1 and 7 and preferred_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]);

comment on column public.subscriptions.preferred_weekdays is 'Días de recogida (1=lunes … 7=domingo) dentro de cada semana de entrega. preferred_weekday se mantiene como el primero de ellos por compatibilidad.';
comment on column public.subscriptions.subtotal_cents is 'Importe por periodo de facturación antes del descuento (cesta × días). Stripe es la autoridad financiera real.';
comment on column public.subscriptions.total_cents is 'Importe por periodo de facturación con el descuento aplicado, tal como lo calcula Stripe.';
comment on column public.subscription_cycles.cycle_start is 'Lunes de la semana de entrega: los ciclos de un mismo periodo de facturación comparten este valor.';

-- Una factura de Stripe cubre ahora todas las entregas de su periodo: ya
-- no es un ciclo por factura. La idempotencia sigue garantizada por
-- payment_events.stripe_event_id.
alter table public.subscription_cycles drop constraint if exists subscription_cycles_stripe_invoice_id_key;
create index if not exists subscription_cycles_stripe_invoice_idx on public.subscription_cycles (stripe_invoice_id);
create index if not exists subscription_cycles_period_idx on public.subscription_cycles (subscription_id, cycle_start);

-- ---------------------------------------------------------------------------
-- 2. Planificación compartida: valida la cesta, busca la primera semana en
--    la que TODOS los días elegidos son reservables y calcula el importe.
--    La usan tanto la vista previa (quote) como la creación real, para que
--    precio y fecha mostrados sean exactamente los que se cobran.
-- ---------------------------------------------------------------------------

create or replace function app_private.week_monday(p_date date)
returns date
language sql
immutable
set search_path = ''
as $$
  select p_date - (extract(isodow from p_date)::integer - 1);
$$;

create or replace function app_private.plan_subscription_basket(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_weekdays smallint[],
  p_lock boolean
)
returns table(ok boolean, reason text, week_start date, collection_dates date[], subtotal_cents integer, discount_percent numeric, total_cents integer, deliveries integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  days smallint[];
  agg record;
  v record;
  av record;
  delivery_subtotal integer := 0;
  total_qty integer := 0;
  discount numeric := 0;
  monday date;
  dates date[];
  d date;
  week_ok boolean;
  failure text;
  attempt integer;
begin
  select array_agg(distinct x order by x) into days from unnest(coalesce(p_weekdays, '{}')) x;
  if days is null or cardinality(days) = 0 or not days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] then
    return query select false, 'invalid_weekday', null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'invalid_basket', null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
  end if;

  for agg in
    select (value ->> 'variant_id')::uuid as variant_id, sum((value ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) group by 1
  loop
    if agg.quantity is null or agg.quantity <= 0 then
      return query select false, 'invalid_quantity', null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
    end if;
    select pv.*, p.status product_status into v from public.product_variants pv join public.products p on p.id = pv.product_id where pv.id = agg.variant_id;
    if not found or v.status <> 'active' or v.product_status not in ('active', 'seasonal') or v.price_cents is null or not v.subscribable then
      return query select false, 'variant_not_subscribable', null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
    end if;
    total_qty := total_qty + agg.quantity;
    delivery_subtotal := delivery_subtotal + v.price_cents * agg.quantity;
  end loop;

  -- Primera semana en la que todos los días elegidos se pueden reservar. Se
  -- salta una semana entera si alguno de sus días ya pasó o ya superó el
  -- corte de antelación; cualquier otro motivo (capacidad, punto cerrado,
  -- producto no admitido…) se devuelve tal cual.
  monday := app_private.week_monday(current_date);
  for attempt in 0..5 loop
    dates := array(select monday + (wd - 1) from unnest(days) wd order by wd);
    week_ok := true;
    failure := null;
    foreach d in array dates loop
      if d <= current_date then week_ok := false; failure := 'cutoff_passed'; exit; end if;
      for agg in
        select (value ->> 'variant_id')::uuid as variant_id, sum((value ->> 'quantity')::integer) as quantity
        from jsonb_array_elements(p_items) group by 1 order by 1
      loop
        if p_lock then
          perform pg_advisory_xact_lock(1, hashtext(agg.variant_id::text || d::text));
          perform pg_advisory_xact_lock(2, hashtext(p_pickup_point_id::text || d::text));
        end if;
        select * into av from app_private.variant_availability(agg.variant_id, p_pickup_point_id, d);
        if not av.is_available or agg.quantity > av.remaining then
          week_ok := false;
          failure := coalesce(av.reason, 'capacity_unavailable');
          exit;
        end if;
      end loop;
      exit when not week_ok;
    end loop;

    if week_ok then exit; end if;
    if failure <> 'cutoff_passed' then
      return query select false, failure, null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
    end if;
    monday := monday + 7;
  end loop;

  if not week_ok then
    return query select false, coalesce(failure, 'no_bookable_week'), null::date, null::date[], null::integer, null::numeric, null::integer, null::integer; return;
  end if;

  discount := case when total_qty >= 4 then 5 else 0 end;
  return query select
    true,
    'ok'::text,
    monday,
    dates,
    delivery_subtotal * cardinality(days),
    discount,
    round(delivery_subtotal * cardinality(days) * (1 - discount / 100.0))::integer,
    cardinality(days);
end;
$$;

revoke all on function app_private.plan_subscription_basket(jsonb, uuid, smallint[], boolean) from public;

-- Vista previa para el configurador: mismo cálculo, sin reservar nada.
create or replace function public.quote_subscription_basket(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_weekdays smallint[]
)
returns table(ok boolean, reason text, collection_dates date[], subtotal_cents integer, discount_percent numeric, total_cents integer, deliveries integer)
language sql
security definer
set search_path = ''
as $$
  select p.ok, p.reason, p.collection_dates, p.subtotal_cents, p.discount_percent, p.total_cents, p.deliveries
  from app_private.plan_subscription_basket(p_items, p_pickup_point_id, p_weekdays, false) p;
$$;

revoke all on function public.quote_subscription_basket(jsonb, uuid, smallint[]) from public;
grant execute on function public.quote_subscription_basket(jsonb, uuid, smallint[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. create_subscription_basket(): varios días + preferencias.
-- ---------------------------------------------------------------------------

create or replace function public.create_subscription_basket(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_weekdays smallint[],
  p_frequency public.subscription_frequency,
  p_wants_new_breads boolean default false,
  p_allow_substitution boolean default false,
  p_customer_note text default null
)
returns table(ok boolean, reason text, subscription_id uuid, cycle_id uuid, collection_date date, subtotal_cents integer, discount_percent numeric, total_cents integer, deliveries integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  plan record;
  s uuid;
  first_cycle uuid;
  c uuid;
  d date;
  note text := nullif(btrim(coalesce(p_customer_note, '')), '');
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if note is not null and char_length(note) > 500 then
    return query select false, 'note_too_long', null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer, null::integer; return;
  end if;

  select * into plan from app_private.plan_subscription_basket(p_items, p_pickup_point_id, p_weekdays, true);
  if not plan.ok then
    return query select false, plan.reason, null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer, null::integer; return;
  end if;

  insert into public.subscriptions (
    customer_id, pickup_point_id, preferred_weekday, preferred_weekdays, frequency, status, next_collection_date,
    subtotal_cents, discount_percent, total_cents, wants_new_breads, allow_substitution, customer_note
  )
  values (
    auth.uid(), p_pickup_point_id, extract(isodow from plan.collection_dates[1])::integer,
    array(select extract(isodow from x)::smallint from unnest(plan.collection_dates) x order by 1),
    p_frequency, 'incomplete', plan.collection_dates[1],
    plan.subtotal_cents, plan.discount_percent, plan.total_cents,
    coalesce(p_wants_new_breads, false), coalesce(p_allow_substitution, false), note
  )
  returning id into s;

  insert into public.subscription_items (subscription_id, product_variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents_snapshot, vat_rate_snapshot)
  select s, basket.variant_id, p.name, pv.name, basket.quantity, pv.price_cents, pv.vat_rate
  from (
    select (value ->> 'variant_id')::uuid as variant_id, sum((value ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) group by 1
  ) basket
  join public.product_variants pv on pv.id = basket.variant_id
  join public.products p on p.id = pv.product_id;

  foreach d in array plan.collection_dates loop
    insert into public.subscription_cycles (subscription_id, cycle_start, cycle_end, collection_date, status, capacity_reserved)
    values (s, plan.week_start, plan.collection_dates[cardinality(plan.collection_dates)], d, 'capacity_reserved', true)
    returning id into c;
    first_cycle := coalesce(first_cycle, c);
    insert into public.subscription_capacity_allocations (product_variant_id, pickup_point_id, allocation_date, quantity, source_reference, subscription_cycle_id)
    select product_variant_id, p_pickup_point_id, d, quantity, s::text, c from public.subscription_items where subscription_items.subscription_id = s;
  end loop;

  insert into public.subscription_status_history (subscription_id, new_status, actor_id, source, reason)
  values (s, 'incomplete', auth.uid(), 'customer', 'subscription_candidate_created');

  return query select true, 'incomplete'::text, s, first_cycle, plan.collection_dates[1], plan.subtotal_cents, plan.discount_percent, plan.total_cents, plan.deliveries;
end;
$$;

-- La firma anterior (un solo día) se conserva solo como envoltorio para no
-- romper una versión de la app desplegada antes que esta migración; delega
-- en la nueva sin duplicar lógica.
drop function if exists public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid);
create function public.create_subscription_basket(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_weekday integer,
  p_frequency public.subscription_frequency,
  p_window_id uuid default null
)
returns table(ok boolean, reason text, subscription_id uuid, cycle_id uuid, collection_date date, subtotal_cents integer, discount_percent numeric, total_cents integer)
language sql
security definer
set search_path = ''
as $$
  select r.ok, r.reason, r.subscription_id, r.cycle_id, r.collection_date, r.subtotal_cents, r.discount_percent, r.total_cents
  from public.create_subscription_basket(p_items, p_pickup_point_id, array[p_weekday]::smallint[], p_frequency, false, false, null) r;
$$;
comment on function public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid) is 'Obsoleta: compatibilidad con la app anterior. Usar la versión con p_weekdays smallint[].';

revoke all on function public.create_subscription_basket(jsonb, uuid, smallint[], public.subscription_frequency, boolean, boolean, text) from public;
grant execute on function public.create_subscription_basket(jsonb, uuid, smallint[], public.subscription_frequency, boolean, boolean, text) to authenticated;
revoke all on function public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid) from public;
grant execute on function public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. generate_subscription_cycles(): un periodo = todas las entregas de su
--    semana. Se genera el periodo siguiente cuando el último ya está resuelto
--    (pedidos creados o saltado por una pausa) y no hay otro pendiente.
--    Además: si una pausa dejó el último periodo en el pasado, se avanza
--    hasta la primera semana futura (antes, una suscripción retomada tras
--    una pausa no volvía a generar ciclos nunca más).
-- ---------------------------------------------------------------------------

create or replace function public.generate_subscription_cycles()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  last_start date;
  next_monday date;
  dates date[];
  horizon integer;
  created_count integer := 0;
  blocked_count integer := 0;
  c uuid;
  d date;
  av record;
  item record;
  all_available boolean;
  failure text;
  guard integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  select (value #>> '{}')::integer into horizon from public.app_settings where key = 'subscriptions.cycle_generation_days_ahead';
  horizon := coalesce(horizon, 35);

  for s in select * from public.subscriptions where status in ('active', 'trialing') loop
    select max(cycle_start) into last_start from public.subscription_cycles where subscription_id = s.id;
    if last_start is null then continue; end if;
    -- El último periodo tiene que estar resuelto: pedidos creados (o pagados)
    -- o saltado. Si sigue reservado o facturado, todavía no toca.
    if exists (
      select 1 from public.subscription_cycles
      where subscription_id = s.id and status in ('planned', 'capacity_reserved', 'invoiced')
    ) then
      continue;
    end if;
    if not exists (
      select 1 from public.subscription_cycles
      where subscription_id = s.id and cycle_start = last_start and status in ('order_created', 'paid', 'skipped')
    ) then
      continue;
    end if;

    next_monday := last_start;
    guard := 0;
    loop
      next_monday := case s.frequency
        when 'weekly' then next_monday + 7
        when 'biweekly' then next_monday + 14
        when 'every_3_weeks' then next_monday + 21
        -- Un mes no es un número entero de semanas: se toma el lunes de la
        -- semana que contiene la fecha "un mes después".
        else app_private.week_monday((next_monday + interval '1 month')::date)
      end;
      dates := array(select next_monday + (wd - 1) from unnest(s.preferred_weekdays) wd order by wd);
      guard := guard + 1;
      exit when dates[1] > current_date or guard > 60;
    end loop;

    if dates[1] > current_date + horizon then continue; end if;
    if exists (select 1 from public.subscription_cycles where subscription_id = s.id and collection_date = any(dates)) then continue; end if;

    all_available := true;
    failure := null;
    foreach d in array dates loop
      perform pg_advisory_xact_lock(2, hashtext(s.pickup_point_id::text || d::text));
      for item in select * from public.subscription_items where subscription_id = s.id order by product_variant_id loop
        perform pg_advisory_xact_lock(1, hashtext(item.product_variant_id::text || d::text));
        select * into av from app_private.variant_availability(item.product_variant_id, s.pickup_point_id, d);
        if not av.is_available or item.quantity > av.remaining then
          all_available := false;
          failure := d::text || ':' || coalesce(av.reason, 'capacity_unavailable');
          exit;
        end if;
      end loop;
      exit when not all_available;
    end loop;

    if not all_available then
      update public.subscriptions set status = 'requires_attention', requires_attention_reason = 'next_cycle_capacity_unavailable' where id = s.id;
      insert into public.subscription_status_history (subscription_id, previous_status, new_status, source, reason)
      values (s.id, s.status, 'requires_attention', 'system', 'cycle_generation:' || failure);
      blocked_count := blocked_count + 1;
      continue;
    end if;

    foreach d in array dates loop
      insert into public.subscription_cycles (subscription_id, cycle_start, cycle_end, collection_date, status, capacity_reserved)
      values (s.id, next_monday, dates[cardinality(dates)], d, 'capacity_reserved', true)
      returning id into c;
      insert into public.subscription_capacity_allocations (product_variant_id, pickup_point_id, allocation_date, quantity, source_reference, subscription_cycle_id)
      select product_variant_id, s.pickup_point_id, d, quantity, s.id::text, c from public.subscription_items where subscription_id = s.id;
      created_count := created_count + 1;
    end loop;
    update public.subscriptions set next_collection_date = dates[1] where id = s.id;
  end loop;

  insert into public.audit_logs (action, entity_type, new_data) values ('subscriptions.cycles.generated', 'subscriptions', jsonb_build_object('created', created_count, 'blocked', blocked_count));
  return jsonb_build_object('created', created_count, 'blocked', blocked_count);
end;
$$;

revoke all on function public.generate_subscription_cycles() from public;
grant execute on function public.generate_subscription_cycles() to service_role;

-- ---------------------------------------------------------------------------
-- 5. Pausa/cancelación: se decide con la entrega más próxima del periodo
--    pendiente (misma regla de 48h). Si todavía se puede, se liberan TODAS
--    las entregas pendientes de ese periodo; si no, el periodo entero sigue
--    su curso y el cambio surte efecto desde el siguiente.
-- ---------------------------------------------------------------------------

create or replace function app_private.release_pending_subscription_cycle(p_subscription_id uuid, p_reason text)
returns table(effective text, effective_date date)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.subscription_cycles;
  v_cutoff_time time;
  v_cutoff_days_before integer;
  v_timezone text;
  v_deadline timestamptz;
begin
  select * into c from public.subscription_cycles
    where subscription_id = p_subscription_id and status in ('planned', 'capacity_reserved', 'invoiced')
    order by collection_date limit 1;
  if not found then
    return query select 'immediate'::text, null::date; return;
  end if;

  select (value #>> '{}')::time into v_cutoff_time from public.app_settings where key = 'availability.cutoff_time';
  select (value #>> '{}')::integer into v_cutoff_days_before from public.app_settings where key = 'availability.cutoff_days_before';
  select (value #>> '{}') into v_timezone from public.app_settings where key = 'operational.timezone';
  v_timezone := coalesce(v_timezone, 'Europe/Madrid');
  v_deadline := ((c.collection_date - coalesce(v_cutoff_days_before, 2))::text || ' ' || coalesce(v_cutoff_time, '10:00:00'::time)::text)::timestamp at time zone v_timezone;

  if now() < v_deadline then
    delete from public.subscription_capacity_allocations
      where subscription_cycle_id in (
        select id from public.subscription_cycles
        where subscription_id = p_subscription_id and status in ('planned', 'capacity_reserved', 'invoiced')
      );
    update public.subscription_cycles set status = 'skipped', capacity_reserved = false, failure_reason = p_reason
      where subscription_id = p_subscription_id and status in ('planned', 'capacity_reserved', 'invoiced');
    return query select 'immediate'::text, c.collection_date; return;
  else
    return query select 'next_cycle'::text, c.collection_date; return;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. process_subscription_invoice(): una factura pagada cubre todas las
--    entregas de su periodo -> un pedido por entrega. El importe cobrado se
--    reparte entre los pedidos (el resto de céntimos va al primero). Las
--    preferencias del cliente se copian a la nota interna de cada pedido.
-- ---------------------------------------------------------------------------

create or replace function public.process_subscription_invoice(p_event_id text, p_invoice_id text, p_stripe_subscription text, p_payment_intent text, p_amount integer, p_currency text, p_payload_hash text)
returns table(ok boolean, reason text, order_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
  c public.subscription_cycles;
  period_start date;
  n integer;
  share integer;
  idx integer := 0;
  amount integer;
  o uuid;
  first_order uuid;
  code text;
  note text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if exists (select 1 from public.payment_events where stripe_event_id = p_event_id) then
    select sc.order_id into o from public.subscription_cycles sc where sc.stripe_invoice_id = p_invoice_id order by sc.collection_date limit 1;
    return query select true, 'already_processed', o; return;
  end if;

  select * into s from public.subscriptions where stripe_subscription_id = p_stripe_subscription for update;
  if not found then
    insert into public.payment_events (stripe_event_id, event_type, payment_intent_id, processing_status, payload_hash, error_message, processed_at)
    values (p_event_id, 'invoice.paid', p_payment_intent, 'failed', p_payload_hash, 'subscription_not_found', now());
    return query select false, 'subscription_not_found', null::uuid; return;
  end if;

  select min(cycle_start) into period_start from public.subscription_cycles
    where subscription_id = s.id and status in ('planned', 'capacity_reserved', 'invoiced');
  if period_start is null then
    update public.subscriptions set status = 'requires_attention', requires_attention_reason = 'paid_invoice_without_cycle' where id = s.id;
    return query select false, 'cycle_not_found', null::uuid; return;
  end if;

  select count(*) into n from public.subscription_cycles
    where subscription_id = s.id and cycle_start = period_start and status in ('planned', 'capacity_reserved', 'invoiced');
  share := p_amount / n;

  note := nullif(concat_ws(' · ',
    'Plan de Pan',
    case when s.allow_substitution then 'Permite sustitución si un pan no está disponible' end,
    case when s.wants_new_breads then 'Quiere probar panes nuevos' end,
    case when s.customer_note is not null then 'Nota del cliente: ' || s.customer_note end
  ), 'Plan de Pan');

  for c in
    select * from public.subscription_cycles
    where subscription_id = s.id and cycle_start = period_start and status in ('planned', 'capacity_reserved', 'invoiced')
    order by collection_date
    for update
  loop
    idx := idx + 1;
    amount := share + case when idx = 1 then p_amount - share * n else 0 end;
    code := 'FZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.orders (public_code, customer_id, pickup_point_id, collection_date, status, payment_status, total_cents, subtotal_cents, tax_cents, currency, confirmed_at, order_type, subscription_id, subscription_cycle_id, internal_note)
    values (code, s.customer_id, s.pickup_point_id, c.collection_date, 'confirmed', 'paid', amount, amount, 0, 'EUR', now(), 'subscription', s.id, c.id, note)
    returning id into o;
    first_order := coalesce(first_order, o);
    insert into public.order_items (order_id, product_id, product_variant_id, product_name_snapshot, variant_name_snapshot, approximate_weight_snapshot, unit_price_cents, vat_rate_snapshot, tax_cents, quantity, line_total_cents)
    select o, v.product_id, i.product_variant_id, i.product_name_snapshot, i.variant_name_snapshot, v.approximate_weight_grams, i.unit_price_cents_snapshot, i.vat_rate_snapshot, 0, i.quantity, i.quantity * i.unit_price_cents_snapshot
    from public.subscription_items i join public.product_variants v on v.id = i.product_variant_id where i.subscription_id = s.id;
    update public.subscription_cycles set status = 'order_created', stripe_invoice_id = p_invoice_id, stripe_payment_intent_id = p_payment_intent, order_id = o where id = c.id;
  end loop;

  update public.subscriptions set status = 'active', requires_attention_reason = null where id = s.id;
  insert into public.payment_events (stripe_event_id, event_type, payment_intent_id, order_id, processing_status, payload_hash, processed_at)
  values (p_event_id, 'invoice.paid', p_payment_intent, first_order, 'processed', p_payload_hash, now());
  insert into public.subscription_status_history (subscription_id, previous_status, new_status, source, reason)
  values (s.id, s.status, 'active', 'stripe_webhook', 'invoice.paid');
  return query select true, 'order_created', first_order;
end;
$$;
