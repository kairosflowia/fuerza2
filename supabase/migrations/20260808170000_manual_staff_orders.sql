-- Documento funcional del cliente, sección 5: "Sistema de reservas unificado
-- — todos los pedidos (web/WhatsApp/presencial) se gestionan en un único
-- sistema". Hoy solo existe un camino de creación de pedido confirmado: el
-- checkout público vía Stripe (create_checkout_order + process_payment_event).
-- Un pedido tomado por WhatsApp o teléfono queda invisible para
-- app_private.variant_availability(): no descuenta capacidad de producción
-- ni stock_quantity, así que la web puede seguir ofreciendo algo que el
-- obrador ya vendió por otro canal. Es el mismo riesgo de sobreventa que las
-- fases anteriores (corte de 48h, stock_quantity) ya cerraron para sus
-- respectivos casos.
--
-- create_staff_order() cierra ese hueco: mismo motor de disponibilidad
-- (app_private.variant_availability, con los mismos bloqueos advisory) que
-- create_checkout_order, pero crea el pedido ya 'confirmed' -- sin ventana de
-- pago ni Stripe, porque un pedido tomado por teléfono/WhatsApp/presencial se
-- da por cobrado (o pendiente de cobro explícito) por quien lo registra, no
-- por un webhook. También registra el movimiento de 'venta' de estoque para
-- variantes con stock_tracking, igual que hace process_payment_event() para
-- los pedidos web.
--
-- channel distingue el origen del pedido (web/whatsapp/phone/in_person) para
-- que el panel pueda mostrarlo -- create_checkout_order no lo recibe como
-- parámetro y sigue creando pedidos con el valor por defecto 'web'.

alter table public.orders add column channel text not null default 'web' check (channel in ('web', 'whatsapp', 'phone', 'in_person'));

create or replace function public.create_staff_order(
  p_items jsonb,
  p_pickup_point_id uuid,
  p_collection_date date,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_channel text default 'phone',
  p_payment_status text default 'paid',
  p_notes text default null
)
returns table(ok boolean, reason text, order_id uuid, public_code text, total_cents integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  i jsonb;
  v record;
  av record;
  oid uuid;
  code text;
  subtotal integer := 0;
  tax integer := 0;
  line integer;
  line_tax integer;
  qty integer;
  vid uuid;
  v_source public.order_event_source;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  if p_channel not in ('whatsapp', 'phone', 'in_person') then
    return query select false, 'invalid_channel', null::uuid, null::text, null::integer; return;
  end if;
  if p_payment_status not in ('paid', 'pending') then
    return query select false, 'invalid_payment_status', null::uuid, null::text, null::integer; return;
  end if;
  if trim(coalesce(p_customer_name, '')) = '' or trim(coalesce(p_customer_phone, '')) = '' then
    return query select false, 'invalid_customer', null::uuid, null::text, null::integer; return;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'invalid_checkout', null::uuid, null::text, null::integer; return;
  end if;

  v_source := case when app_private.has_role('operator') and not (app_private.has_role('owner') or app_private.has_role('admin')) then 'operator' else 'admin' end;

  for i in select value from jsonb_array_elements(p_items) order by value ->> 'variant_id' loop
    vid := (i ->> 'variant_id')::uuid;
    qty := (i ->> 'quantity')::integer;
    if qty <= 0 then
      return query select false, 'invalid_quantity', null::uuid, null::text, null::integer; return;
    end if;

    perform pg_advisory_xact_lock(1, hashtext(vid::text || p_collection_date::text));
    perform pg_advisory_xact_lock(2, hashtext(p_pickup_point_id::text || p_collection_date::text));

    select pv.*, p.name product_name, p.status product_status
      into v
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = vid;
    if not found or v.status <> 'active' or v.product_status not in ('active', 'seasonal') or v.price_cents is null then
      return query select false, 'variant_unavailable', null::uuid, null::text, null::integer; return;
    end if;

    select * into av from app_private.variant_availability(vid, p_pickup_point_id, p_collection_date);
    if not av.is_available or qty > av.remaining then
      return query select false, coalesce(av.reason, 'sold_out'), null::uuid, null::text, null::integer; return;
    end if;
  end loop;

  code := 'FZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    public_code, customer_name, customer_email, customer_phone, pickup_point_id, collection_date,
    status, payment_status, confirmed_at, subtotal_cents, tax_cents, total_cents, currency, channel, internal_note
  )
  values (
    code, trim(p_customer_name), nullif(lower(trim(coalesce(p_customer_email, ''))), ''), trim(p_customer_phone), p_pickup_point_id, p_collection_date,
    'confirmed', p_payment_status::public.payment_status, now(), 0, 0, 0, 'EUR', p_channel, p_notes
  )
  returning id into oid;

  for i in select value from jsonb_array_elements(p_items) loop
    vid := (i ->> 'variant_id')::uuid;
    qty := (i ->> 'quantity')::integer;
    select pv.*, p.id product_id, p.name product_name
      into v
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = vid;
    line := v.price_cents * qty;
    line_tax := round(line * (v.vat_rate / (100 + v.vat_rate)));
    subtotal := subtotal + line - line_tax;
    tax := tax + line_tax;

    insert into public.order_items (
      order_id, product_id, product_variant_id, product_name_snapshot, variant_name_snapshot,
      approximate_weight_snapshot, unit_price_cents, vat_rate_snapshot, tax_cents, quantity, line_total_cents
    )
    values (oid, v.product_id, vid, v.product_name, v.name, v.approximate_weight_grams, v.price_cents, v.vat_rate, line_tax, qty, line);
  end loop;

  update public.orders set subtotal_cents = subtotal, tax_cents = tax, total_cents = subtotal + tax where id = oid;

  insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes, created_by)
  select oi.product_variant_id, 'venta', -oi.quantity, oid, 'Venta confirmada manualmente (' || p_channel || ')', (select auth.uid())
  from public.order_items oi
  join public.product_variants pv on pv.id = oi.product_variant_id
  where oi.order_id = oid and pv.stock_tracking;

  insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
  values (oid, null, 'confirmed', (select auth.uid()), v_source, 'Pedido manual (' || p_channel || ')');

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  values ((select auth.uid()), 'order.created_manual', 'orders', oid::text, jsonb_build_object('public_code', code, 'channel', p_channel, 'total_cents', subtotal + tax));

  return query select true, 'confirmed', oid, code, subtotal + tax;
end;
$$;

revoke all on function public.create_staff_order(jsonb, uuid, date, text, text, text, text, text, text) from public;
grant execute on function public.create_staff_order(jsonb, uuid, date, text, text, text, text, text, text) to authenticated;

-- cancel_order() nunca se actualizó cuando checkout_payments_orders.sql añadió
-- cancelled_at/cancellation_reason ni cuando pedidos.actions.ts empezó a
-- insertar en order_status_history desde el panel -- el panel admin cancela
-- con un UPDATE directo (bypasseando esta función y su devolución de
-- estoque). Se completa aquí para que sea la única vía de cancelación
-- correcta y el panel pueda apoyarse en ella sin perder cancelled_at,
-- cancellation_reason ni el historial.
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

  if v_order.status = 'confirmed' then
    insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes, created_by)
    select oi.product_variant_id, 'devolucion', oi.quantity, p_order_id, coalesce('Pedido cancelado: ' || p_reason, 'Pedido cancelado'), (select auth.uid())
    from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
    where oi.order_id = p_order_id and pv.stock_tracking;
  end if;

  update public.orders
    set status = 'cancelled', cancelled_at = now(), cancellation_reason = coalesce(p_reason, 'Cancelación operativa')
    where id = p_order_id;

  insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
  values (p_order_id, v_order.status, 'cancelled', (select auth.uid()), 'admin', p_reason);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data, new_data, metadata)
  values ((select auth.uid()), 'order.cancelled', 'orders', p_order_id::text, jsonb_build_object('status', v_order.status), jsonb_build_object('status', 'cancelled'), jsonb_build_object('reason', p_reason));

  return query select true, 'cancelled';
end;
$$;
