-- Documento funcional del cliente, sección 7: "Fuerza Habitual: cliente
-- elige productos + frecuencia (semanal/quincenal/cada 3 semanas/mensual) +
-- día habitual; 5% descuento con 4+ unidades; pausar/cancelar respetando
-- plazo de producción de 48h."
--
-- El modelo anterior (20260803240000_plan_de_pan_subscriptions.sql) era lo
-- contrario en varios puntos a la vez:
--   - subscription_plans/subscription_plan_items: el admin arma un "plan"
--     con productos y precio FIJOS; el cliente solo elige entre planes ya
--     armados, sin cesta propia.
--   - subscription_frequency solo tenía weekly/biweekly/monthly, sin "cada
--     3 semanas".
--   - El precio salía de un Stripe Price preconfigurado a mano
--     (subscription_plans.stripe_price_id) -- no hay forma de reflejar un
--     descuento por cantidad de una cesta que varía por cliente.
--   - request_subscription_change() solo insertaba una fila 'pending' en
--     subscription_change_requests: no existía NINGÚN job ni función que
--     aplicara pausa/cancelación de verdad, ni en la base ni en Stripe. Sin
--     checagem de 48h en ningún lado del ciclo de vida de la suscripción.
--   - create_subscription_candidate() solo crea el PRIMER ciclo
--     (subscription_cycles); no existía ningún mecanismo que generara los
--     siguientes -- una suscripción real solo habría producido una única
--     entrega, nunca las siguientes.
--
-- No hay datos reales que migrar: subscription_plans/subscriptions/
-- subscription_items/subscription_cycles están vacías en producción (el
-- único plan de prueba se borró en 20260808135000_remove_placeholder_catalog.sql),
-- así que se rediseña la parte que cambia en vez de parchearla.

-- ---------------------------------------------------------------------------
-- 1. Fuera: subscription_plans/subscription_plan_items y la columna que las
--    referenciaba. subscriptions.stripe_price_id también sale: una
--    suscripción ahora puede tener varios artículos, cada uno con su propio
--    Price dinámico de Stripe (price_data), no un único Price fijo.
-- ---------------------------------------------------------------------------

alter table public.subscriptions drop column subscription_plan_id;
alter table public.subscriptions drop column stripe_price_id;
drop table public.subscription_plan_items;
drop table public.subscription_plans;
drop function if exists app_private.validate_subscription_plan();

-- ---------------------------------------------------------------------------
-- 2. Qué se puede meter en la cesta: curaduría explícita del obrador, no
--    todo el catálogo. "Explora los panes disponibles en formato membresía."
-- ---------------------------------------------------------------------------

alter table public.product_variants add column subscribable boolean not null default false;

-- subscription_capacity_allocations.subscription_cycle_id era UNIQUE por sí
-- solo (20260803240000_plan_de_pan_subscriptions.sql), lo que permite como
-- mucho UNA fila de capacidad reservada por ciclo en total -- rompe con
-- cualquier cesta de más de un artículo (create_subscription_basket, igual
-- que la create_subscription_candidate original, inserta una fila por
-- artículo de la cesta para el mismo ciclo). Nunca se detectó porque
-- ningún test anterior llegó a ejercitar la función con más de un artículo.
-- Lo correcto es única por (ciclo, variante): como mucho una reserva de esa
-- variante concreta por ciclo, no una única reserva por ciclo en general.
alter table public.subscription_capacity_allocations drop constraint subscription_capacity_allocations_subscription_cycle_id_key;
alter table public.subscription_capacity_allocations add constraint subscription_capacity_allocations_cycle_variant_key unique (subscription_cycle_id, product_variant_id);

-- ---------------------------------------------------------------------------
-- 3. Frecuencia directamente en subscriptions (ya no hay "plan" que la
--    fije), con la cuarta opción que pedía el cliente.
-- ---------------------------------------------------------------------------

alter type public.subscription_frequency add value if not exists 'every_3_weeks';

alter table public.subscriptions
  add column frequency public.subscription_frequency not null default 'weekly',
  add column subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  add column discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  add column total_cents integer not null default 0 check (total_cents >= 0);
comment on column public.subscriptions.subtotal_cents is 'Snapshot informativo del importe por ciclo antes del descuento, calculado al crear la cesta. Stripe es la autoridad financiera real: esto es solo para mostrarlo en la web antes de que Stripe confirme el primer cobro.';
comment on column public.subscriptions.discount_percent is '5% si la cesta tenía 4 o más unidades en el momento de crearla (Documento funcional §7), aplicado como descuento real en Stripe, no como crédito aparte.';

-- ---------------------------------------------------------------------------
-- 4. create_subscription_basket(): reemplaza a create_subscription_candidate().
--    El cliente manda su propia cesta (variante + cantidad, ya agregada por
--    variante) en vez de un plan_id. Mismo patrón de bloqueos advisory +
--    app_private.variant_availability() que el resto del proyecto usa para
--    evitar sobreventa.
-- ---------------------------------------------------------------------------

create or replace function public.create_subscription_basket(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_weekday integer,
  p_frequency public.subscription_frequency,
  p_window_id uuid default null
)
returns table(ok boolean, reason text, subscription_id uuid, cycle_id uuid, collection_date date, subtotal_cents integer, discount_percent numeric, total_cents integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  av record;
  agg record;
  s uuid;
  c uuid;
  d date;
  total_qty integer := 0;
  subtotal integer := 0;
  discount numeric := 0;
  total integer;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_weekday not between 1 and 7 then
    return query select false, 'invalid_weekday', null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer; return;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'invalid_basket', null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer; return;
  end if;

  d := current_date + ((p_weekday - extract(isodow from current_date)::integer + 7) % 7);
  if d <= current_date then d := d + 7; end if;

  for agg in
    select (value ->> 'variant_id')::uuid as variant_id, sum((value ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items)
    group by 1
    order by 1
  loop
    if agg.quantity <= 0 then
      return query select false, 'invalid_quantity', null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer; return;
    end if;

    select pv.*, p.status product_status into v from public.product_variants pv join public.products p on p.id = pv.product_id where pv.id = agg.variant_id;
    if not found or v.status <> 'active' or v.product_status not in ('active', 'seasonal') or v.price_cents is null or not v.subscribable then
      return query select false, 'variant_not_subscribable', null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer; return;
    end if;

    perform pg_advisory_xact_lock(1, hashtext(agg.variant_id::text || d::text));
    perform pg_advisory_xact_lock(2, hashtext(p_pickup_point_id::text || d::text));
    select * into av from app_private.variant_availability(agg.variant_id, p_pickup_point_id, d);
    if not av.is_available or agg.quantity > av.remaining then
      return query select false, coalesce(av.reason, 'capacity_unavailable'), null::uuid, null::uuid, null::date, null::integer, null::numeric, null::integer; return;
    end if;

    total_qty := total_qty + agg.quantity;
    subtotal := subtotal + v.price_cents * agg.quantity;
  end loop;

  discount := case when total_qty >= 4 then 5 else 0 end;
  total := round(subtotal * (1 - discount / 100.0));

  insert into public.subscriptions (customer_id, pickup_point_id, preferred_weekday, preferred_collection_window_id, frequency, status, next_collection_date, subtotal_cents, discount_percent, total_cents)
  values (auth.uid(), p_pickup_point_id, p_weekday, p_window_id, p_frequency, 'incomplete', d, subtotal, discount, total)
  returning id into s;

  insert into public.subscription_items (subscription_id, product_variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents_snapshot, vat_rate_snapshot)
  select
    s,
    basket.variant_id,
    p.name,
    pv.name,
    basket.quantity,
    pv.price_cents,
    pv.vat_rate
  from (
    select (value ->> 'variant_id')::uuid as variant_id, sum((value ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items)
    group by 1
  ) basket
  join public.product_variants pv on pv.id = basket.variant_id
  join public.products p on p.id = pv.product_id;

  insert into public.subscription_cycles (subscription_id, cycle_start, cycle_end, collection_date, status, capacity_reserved)
  values (s, d, d, d, 'capacity_reserved', true)
  returning id into c;

  insert into public.subscription_capacity_allocations (product_variant_id, pickup_point_id, allocation_date, quantity, source_reference, subscription_cycle_id)
  select product_variant_id, p_pickup_point_id, d, quantity, s::text, c from public.subscription_items where subscription_items.subscription_id = s;

  insert into public.subscription_status_history (subscription_id, new_status, actor_id, source, reason)
  values (s, 'incomplete', auth.uid(), 'customer', 'subscription_candidate_created');

  return query select true, 'incomplete', s, c, d, subtotal, discount, total;
end;
$$;

revoke all on function public.create_subscription_candidate(uuid, uuid, integer, uuid) from public;
drop function public.create_subscription_candidate(uuid, uuid, integer, uuid);
revoke all on function public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid) from public;
grant execute on function public.create_subscription_basket(jsonb, uuid, integer, public.subscription_frequency, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. generate_subscription_cycles(): la pieza que faltaba por completo. Sin
--    esto ninguna suscripción real habría producido más que UNA entrega.
--    Genera el siguiente ciclo de cada suscripción activa cuando el último
--    ya se resolvió (order_created/paid) y no hay ya otro ciclo pendiente,
--    comprobando disponibilidad para TODOS los artículos de la cesta antes
--    de reservarlo -- si cualquiera falla, no se reserva ninguno y la
--    suscripción pasa a requires_attention para revisión manual, en vez de
--    reservar una cesta incompleta.
-- ---------------------------------------------------------------------------

create or replace function public.generate_subscription_cycles()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  last_cycle public.subscription_cycles;
  next_date date;
  horizon integer;
  created_count integer := 0;
  blocked_count integer := 0;
  step interval;
  c uuid;
  av record;
  item record;
  all_available boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  select (value #>> '{}')::integer into horizon from public.app_settings where key = 'subscriptions.cycle_generation_days_ahead';
  horizon := coalesce(horizon, 35);

  for s in select * from public.subscriptions where status in ('active', 'trialing') loop
    select * into last_cycle from public.subscription_cycles where subscription_id = s.id order by collection_date desc limit 1;
    if not found or last_cycle.status not in ('order_created', 'paid') then
      continue;
    end if;
    if exists (select 1 from public.subscription_cycles where subscription_id = s.id and status in ('planned', 'capacity_reserved', 'invoiced')) then
      continue;
    end if;

    step := case s.frequency
      when 'weekly' then interval '7 days'
      when 'biweekly' then interval '14 days'
      when 'every_3_weeks' then interval '21 days'
      when 'monthly' then interval '1 month'
    end;
    next_date := (last_cycle.collection_date + step)::date;
    if s.frequency = 'monthly' then
      -- Un mes no es un número entero de semanas: se ajusta al siguiente
      -- día habitual en o después de esa fecha, para mantener el mismo día
      -- de recogida que eligió el cliente.
      next_date := next_date + ((s.preferred_weekday - extract(isodow from next_date)::integer + 7) % 7);
    end if;

    if next_date > current_date + horizon then continue; end if;
    if exists (select 1 from public.subscription_cycles where subscription_id = s.id and collection_date = next_date) then continue; end if;

    perform pg_advisory_xact_lock(2, hashtext(s.pickup_point_id::text || next_date::text));
    all_available := true;
    for item in select * from public.subscription_items where subscription_id = s.id loop
      perform pg_advisory_xact_lock(1, hashtext(item.product_variant_id::text || next_date::text));
      select * into av from app_private.variant_availability(item.product_variant_id, s.pickup_point_id, next_date);
      if not av.is_available or item.quantity > av.remaining then
        all_available := false;
        exit;
      end if;
    end loop;

    if not all_available then
      update public.subscriptions set status = 'requires_attention', requires_attention_reason = 'next_cycle_capacity_unavailable' where id = s.id;
      insert into public.subscription_status_history (subscription_id, previous_status, new_status, source, reason)
      values (s.id, s.status, 'requires_attention', 'system', 'cycle_generation:' || next_date::text);
      blocked_count := blocked_count + 1;
      continue;
    end if;

    insert into public.subscription_cycles (subscription_id, cycle_start, cycle_end, collection_date, status, capacity_reserved)
    values (s.id, next_date, next_date, next_date, 'capacity_reserved', true)
    returning id into c;
    insert into public.subscription_capacity_allocations (product_variant_id, pickup_point_id, allocation_date, quantity, source_reference, subscription_cycle_id)
    select product_variant_id, s.pickup_point_id, next_date, quantity, s.id::text, c from public.subscription_items where subscription_id = s.id;
    created_count := created_count + 1;
  end loop;

  insert into public.audit_logs (action, entity_type, new_data) values ('subscriptions.cycles.generated', 'subscriptions', jsonb_build_object('created', created_count, 'blocked', blocked_count));
  return jsonb_build_object('created', created_count, 'blocked', blocked_count);
end;
$$;

revoke all on function public.generate_subscription_cycles() from public;
grant execute on function public.generate_subscription_cycles() to service_role;

-- ---------------------------------------------------------------------------
-- 6. Pausa/cancelación reales, respetando el plazo de producción de 48h
--    (mismo par de ajustes que gobiernan el corte de reserva y la política
--    de cancelación de pedidos avulsos). Si el ciclo pendiente todavía está
--    a 48h o más, se libera junto con su capacidad reservada y el cambio es
--    inmediato; si está a menos de 48h, ese ciclo ya está comprometido en
--    producción y se deja seguir su curso -- el cambio surte efecto desde el
--    ciclo siguiente. No llaman a Stripe (Postgres no puede): quien invoca
--    usa "effective" para decidir si pausar/cancelar la Stripe subscription
--    ya mismo o programarlo para el final del periodo en curso.
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
    delete from public.subscription_capacity_allocations where subscription_cycle_id = c.id;
    update public.subscription_cycles set status = 'skipped', capacity_reserved = false, failure_reason = p_reason where id = c.id;
    return query select 'immediate'::text, c.collection_date; return;
  else
    return query select 'next_cycle'::text, c.collection_date; return;
  end if;
end;
$$;

create or replace function public.request_subscription_pause(p_subscription_id uuid, p_resume_date date default null)
returns table(ok boolean, reason text, effective text, effective_date date, stripe_subscription_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
  release record;
begin
  select * into s from public.subscriptions where id = p_subscription_id for update;
  if not found then
    return query select false, 'not_found', null::text, null::date, null::text; return;
  end if;
  if not (s.customer_id = auth.uid() or app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if s.status not in ('active', 'trialing') then
    return query select false, 'not_pausable', null::text, null::date, null::text; return;
  end if;

  select * into release from app_private.release_pending_subscription_cycle(s.id, 'paused_by_customer');

  update public.subscriptions set status = 'paused', paused_at = now(), pause_until = p_resume_date where id = s.id;
  insert into public.subscription_status_history (subscription_id, previous_status, new_status, actor_id, source, reason)
  values (s.id, s.status, 'paused', auth.uid(), case when app_private.has_role('owner') or app_private.has_role('admin') then 'admin' else 'customer' end::public.order_event_source, 'pause_' || release.effective);

  return query select true, 'paused', release.effective, release.effective_date, s.stripe_subscription_id;
end;
$$;

create or replace function public.request_subscription_resume(p_subscription_id uuid)
returns table(ok boolean, reason text, stripe_subscription_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
begin
  select * into s from public.subscriptions where id = p_subscription_id for update;
  if not found then
    return query select false, 'not_found', null::text; return;
  end if;
  if not (s.customer_id = auth.uid() or app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if s.status <> 'paused' then
    return query select false, 'not_paused', null::text; return;
  end if;

  update public.subscriptions set status = 'active', paused_at = null, pause_until = null where id = s.id;
  insert into public.subscription_status_history (subscription_id, previous_status, new_status, actor_id, source, reason)
  values (s.id, 'paused', 'active', auth.uid(), case when app_private.has_role('owner') or app_private.has_role('admin') then 'admin' else 'customer' end::public.order_event_source, 'resumed');

  return query select true, 'active', s.stripe_subscription_id;
end;
$$;

create or replace function public.request_subscription_cancellation(p_subscription_id uuid, p_reason text default null)
returns table(ok boolean, reason text, effective text, effective_date date, stripe_subscription_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
  release record;
begin
  select * into s from public.subscriptions where id = p_subscription_id for update;
  if not found then
    return query select false, 'not_found', null::text, null::date, null::text; return;
  end if;
  if not (s.customer_id = auth.uid() or app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if s.status in ('cancelled', 'cancel_pending') then
    return query select false, 'already_cancelled', null::text, null::date, null::text; return;
  end if;

  select * into release from app_private.release_pending_subscription_cycle(s.id, 'cancelled_by_customer');

  if release.effective = 'immediate' then
    update public.subscriptions set status = 'cancelled', cancelled_at = now(), cancellation_reason = p_reason where id = s.id;
    insert into public.subscription_status_history (subscription_id, previous_status, new_status, actor_id, source, reason)
    values (s.id, s.status, 'cancelled', auth.uid(), case when app_private.has_role('owner') or app_private.has_role('admin') then 'admin' else 'customer' end::public.order_event_source, coalesce(p_reason, 'cancel_immediate'));
  else
    update public.subscriptions set status = 'cancel_pending', cancel_at_period_end = true, cancellation_reason = p_reason where id = s.id;
    insert into public.subscription_status_history (subscription_id, previous_status, new_status, actor_id, source, reason)
    values (s.id, s.status, 'cancel_pending', auth.uid(), case when app_private.has_role('owner') or app_private.has_role('admin') then 'admin' else 'customer' end::public.order_event_source, coalesce(p_reason, 'cancel_next_cycle'));
  end if;

  return query select true, 'cancelled', release.effective, release.effective_date, s.stripe_subscription_id;
end;
$$;

revoke all on function public.request_subscription_pause(uuid, date) from public;
revoke all on function public.request_subscription_resume(uuid) from public;
revoke all on function public.request_subscription_cancellation(uuid, text) from public;
grant execute on function public.request_subscription_pause(uuid, date) to authenticated;
grant execute on function public.request_subscription_resume(uuid) to authenticated;
grant execute on function public.request_subscription_cancellation(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. process_subscription_invoice(): la comprobación rígida contra un
--    price_cents fijo (subscription_plans ya no existe) no tenía cómo
--    sobrevivir a precios dinámicos + descuento. Documento 04 y el propio
--    comentario original de esta fase ya decían "Stripe Billing es
--    autoridad financiera; FUERZA es autoridad operacional y de
--    capacidad": se deja de rechazar por importe y se confía en el importe
--    que Stripe ya cobró. Mismo comportamiento previo en todo lo demás.
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
  o uuid;
  code text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if exists (select 1 from public.payment_events where stripe_event_id = p_event_id) then
    select sc.order_id into o from public.subscription_cycles sc where sc.stripe_invoice_id = p_invoice_id;
    return query select true, 'already_processed', o; return;
  end if;

  select * into s from public.subscriptions where stripe_subscription_id = p_stripe_subscription for update;
  if not found then
    insert into public.payment_events (stripe_event_id, event_type, payment_intent_id, processing_status, payload_hash, error_message, processed_at)
    values (p_event_id, 'invoice.paid', p_payment_intent, 'failed', p_payload_hash, 'subscription_not_found', now());
    return query select false, 'subscription_not_found', null::uuid; return;
  end if;

  select * into c from public.subscription_cycles where subscription_id = s.id and status in ('planned', 'capacity_reserved', 'invoiced') order by collection_date limit 1 for update;
  if not found then
    update public.subscriptions set status = 'requires_attention', requires_attention_reason = 'paid_invoice_without_cycle' where id = s.id;
    return query select false, 'cycle_not_found', null::uuid; return;
  end if;

  code := 'FZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders (public_code, customer_id, pickup_point_id, collection_date, status, payment_status, total_cents, subtotal_cents, tax_cents, currency, confirmed_at, order_type, subscription_id, subscription_cycle_id)
  values (code, s.customer_id, s.pickup_point_id, c.collection_date, 'confirmed', 'paid', p_amount, p_amount, 0, 'EUR', now(), 'subscription', s.id, c.id)
  returning id into o;
  insert into public.order_items (order_id, product_id, product_variant_id, product_name_snapshot, variant_name_snapshot, approximate_weight_snapshot, unit_price_cents, vat_rate_snapshot, tax_cents, quantity, line_total_cents)
  select o, v.product_id, i.product_variant_id, i.product_name_snapshot, i.variant_name_snapshot, v.approximate_weight_grams, i.unit_price_cents_snapshot, i.vat_rate_snapshot, 0, i.quantity, i.quantity * i.unit_price_cents_snapshot
  from public.subscription_items i join public.product_variants v on v.id = i.product_variant_id where i.subscription_id = s.id;

  update public.subscription_cycles set status = 'order_created', stripe_invoice_id = p_invoice_id, stripe_payment_intent_id = p_payment_intent, order_id = o where id = c.id;
  update public.subscriptions set status = 'active', requires_attention_reason = null where id = s.id;
  insert into public.payment_events (stripe_event_id, event_type, payment_intent_id, order_id, processing_status, payload_hash, processed_at)
  values (p_event_id, 'invoice.paid', p_payment_intent, o, 'processed', p_payload_hash, now());
  insert into public.subscription_status_history (subscription_id, previous_status, new_status, source, reason)
  values (s.id, s.status, 'active', 'stripe_webhook', 'invoice.paid');
  return query select true, 'order_created', o;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RLS/grants: subscription_plans/subscription_plan_items desaparecen con
--    sus políticas. product_variants.subscribable se lee igual que el
--    resto de la fila (ninguna política nueva). subscriptions/
--    subscription_items/subscription_cycles conservan exactamente las
--    políticas y grants ya existentes.
-- ---------------------------------------------------------------------------
