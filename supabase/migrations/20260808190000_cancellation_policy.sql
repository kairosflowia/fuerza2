-- Documento funcional del cliente, sección 8: "Pago al confirmar. Cancelación
-- con más de 48h de antelación: devolución íntegra. Cancelación con menos de
-- 48h: vale (voucher) por el importe íntegro. La producción empieza 48h
-- antes de la recogida." Hoy no existe ningún camino para que el propio
-- cliente cancele su pedido (solo cancel_order(), restringida a owner/admin,
-- sin ninguna lógica de reembolso ni de vale) ni ningún concepto de vale en
-- el sistema.
--
-- El límite de 48h reutiliza EXACTAMENTE los mismos ajustes
-- ('availability.cutoff_time' + 'availability.cutoff_days_before') que ya
-- gobiernan el corte de reserva (20260808120000_reservation_cutoff_48h.sql):
-- el documento define ambos plazos como el mismo instante ("48h antes de la
-- recogida"), así que no hace falta un segundo ajuste duplicado.
--
-- request_order_cancellation() NO llama a Stripe -- Postgres no puede.
-- Cuando el resultado es 'refund_due', quien la invoca (la ruta de API en
-- Next.js) es responsable de ejecutar el reembolso real vía Stripe; el
-- webhook charge.refunded ya cae en la rama por defecto de
-- process_payment_event() (route.ts la reenvía junto con cualquier evento no
-- reconocido explícitamente), así que no hace falta tocar el webhook. Sí
-- hace falta blindar esa rama para que no vuelva a devolver el mismo stock
-- al almacén dos veces (una vez aquí, al cancelar; otra vez al llegar el
-- webhook) -- ver el create or replace de más abajo.

create type public.store_credit_status as enum ('active', 'redeemed', 'expired');

create table public.store_credits (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  email text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR',
  status public.store_credit_status not null default 'active',
  issued_from_order_id uuid references public.orders(id) on delete set null,
  redeemed_order_id uuid references public.orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.store_credits is 'Vale emitido al cancelar un pedido ya pagado con menos de 48h de antelación (Documento funcional §8). issued_from_order_id es el pedido cancelado que lo origina; redeemed_order_id, el pedido futuro donde se aplicó -- todavía sin flujo de canje en checkout, columna preparada para cuando exista.';
create index store_credits_customer_idx on public.store_credits(customer_id) where status = 'active';
create index store_credits_email_idx on public.store_credits(email) where status = 'active';

create trigger store_credits_updated_at before update on public.store_credits for each row execute function app_private.set_updated_at();
create trigger store_credits_audit after insert or update or delete on public.store_credits for each row execute function app_private.audit_catalog_change();

alter table public.store_credits enable row level security;
revoke all on public.store_credits from anon, authenticated;
create policy store_credits_staff_read on public.store_credits
for select to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
create policy store_credits_admin_manage on public.store_credits
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));
grant select on public.store_credits to authenticated;
grant insert, update, delete on public.store_credits to authenticated;

create or replace function public.request_order_cancellation(
  p_public_code text,
  p_lookup_hash text,
  p_reason text default null
)
returns table(ok boolean, reason text, resolution text, voucher_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_cutoff_time time;
  v_cutoff_days_before integer;
  v_timezone text;
  v_deadline timestamptz;
  v_voucher_code text;
begin
  select * into v_order from public.orders
    where public_code = p_public_code and lookup_token_hash = p_lookup_hash
    for update;
  if not found then
    return query select false, 'not_found', null::text, null::text; return;
  end if;

  if v_order.status in ('cancelled', 'refunded', 'partially_refunded') then
    return query select false, 'already_cancelled', null::text, null::text; return;
  end if;
  if v_order.status in ('ready', 'collected') then
    return query select false, 'too_late_to_cancel', null::text, null::text; return;
  end if;
  if v_order.status not in ('pending_payment', 'payment_processing', 'confirmed') then
    return query select false, 'not_cancellable', null::text, null::text; return;
  end if;

  if v_order.payment_status <> 'paid' then
    -- Nada se ha cobrado todavía: se cancela sin política de reembolso/vale.
    update public.orders set status = 'cancelled', cancelled_at = now(), cancellation_reason = coalesce(p_reason, 'Cancelado por el cliente') where id = v_order.id;
    insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
    values (v_order.id, v_order.status, 'cancelled', v_order.customer_id, 'customer', p_reason);
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    values (v_order.customer_id, 'order.cancelled_by_customer', 'orders', v_order.id::text, jsonb_build_object('resolution', 'cancelled_unpaid'));
    return query select true, 'cancelled', 'cancelled_unpaid', null::text; return;
  end if;

  select (value #>> '{}')::time into v_cutoff_time from public.app_settings where key = 'availability.cutoff_time';
  select (value #>> '{}')::integer into v_cutoff_days_before from public.app_settings where key = 'availability.cutoff_days_before';
  select (value #>> '{}') into v_timezone from public.app_settings where key = 'operational.timezone';
  v_timezone := coalesce(v_timezone, 'Europe/Madrid');
  v_deadline := ((v_order.collection_date - coalesce(v_cutoff_days_before, 2))::text || ' ' || coalesce(v_cutoff_time, '10:00:00'::time)::text)::timestamp at time zone v_timezone;

  if v_order.status = 'confirmed' then
    insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes)
    select oi.product_variant_id, 'devolucion', oi.quantity, v_order.id, 'Pedido cancelado por el cliente'
    from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
    where oi.order_id = v_order.id and pv.stock_tracking;
  end if;

  if now() < v_deadline then
    -- 48h o más de antelación: devolución íntegra. request_order_cancellation
    -- no llama a Stripe; el llamador ejecuta el reembolso real al ver
    -- resolution='refund_due' y el webhook charge.refunded confirma el
    -- estado final (ver guarda de idempotencia en process_payment_event).
    update public.orders set status = 'cancelled', cancelled_at = now(), cancellation_reason = coalesce(p_reason, 'Cancelado por el cliente') where id = v_order.id;
    insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
    values (v_order.id, v_order.status, 'cancelled', v_order.customer_id, 'customer', p_reason);
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    values (v_order.customer_id, 'order.cancelled_by_customer', 'orders', v_order.id::text, jsonb_build_object('resolution', 'refund_due'));
    return query select true, 'cancelled', 'refund_due', null::text; return;
  else
    -- Menos de 48h: vale por el importe íntegro en vez de reembolso.
    v_voucher_code := 'VALE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    insert into public.store_credits (code, customer_id, email, amount_cents, issued_from_order_id)
    values (v_voucher_code, v_order.customer_id, coalesce(v_order.customer_email, v_order.guest_email), v_order.total_cents, v_order.id);

    update public.orders set status = 'cancelled', cancelled_at = now(), cancellation_reason = coalesce(p_reason, 'Cancelado por el cliente') where id = v_order.id;
    insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
    values (v_order.id, v_order.status, 'cancelled', v_order.customer_id, 'customer', p_reason);
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    values (v_order.customer_id, 'order.cancelled_by_customer', 'orders', v_order.id::text, jsonb_build_object('resolution', 'voucher_issued', 'voucher_code', v_voucher_code));

    perform app_private.enqueue_notification(
      'voucher-issued', 'orders', v_order.id::text,
      coalesce(v_order.customer_email, v_order.guest_email), v_order.customer_id,
      jsonb_build_object('customer_name', v_order.customer_name, 'order_code', v_order.public_code, 'voucher_code', v_voucher_code, 'voucher_amount', v_order.total_cents),
      'voucher-issued:' || v_order.id::text, 'high'::public.notification_priority
    );

    return query select true, 'cancelled', 'voucher_issued', v_voucher_code; return;
  end if;
end;
$$;

revoke all on function public.request_order_cancellation(text, text, text) from public;
grant execute on function public.request_order_cancellation(text, text, text) to anon, authenticated, service_role;

insert into public.notification_templates (key, name, subject_template, body_html_template, body_text_template, status, version, required_variables)
values (
  'voucher-issued', 'Vale emitido', 'Vale de {{voucher_amount}} para tu próximo pedido',
  '<h1>Hemos emitido un vale</h1><p>Hola {{customer_name}}.</p><p>Tu pedido {{order_code}} se canceló con menos de 48h de antelación, así que en vez de una devolución hemos emitido un vale por el importe íntegro.</p><p>Código del vale: {{voucher_code}}.</p>',
  'Tu pedido {{order_code}} se canceló con menos de 48h de antelación. Hemos emitido un vale por el importe íntegro. Código: {{voucher_code}}.',
  'active', 1, array['customer_name', 'order_code', 'voucher_code', 'voucher_amount']
);

-- Guarda de idempotencia: sin esto, un pedido cancelado por
-- request_order_cancellation() (que ya devuelve el estoque de inmediato) se
-- vería restituido una SEGUNDA vez cuando llega el webhook charge.refunded
-- y process_payment_event() intenta devolverlo de nuevo. Mismo
-- comportamiento previo en todo lo demás -- create or replace conserva la
-- firma exacta.
create or replace function public.process_payment_event(p_event_id text, p_event_type text, p_payment_intent text, p_amount integer, p_currency text, p_payload_hash text)
returns table(ok boolean, reason text, order_id uuid, public_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  existing public.payment_events;
  target public.order_status;
  pay public.payment_status;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;

  select * into existing from public.payment_events where stripe_event_id = p_event_id;
  if found then
    select * into o from public.orders where id = existing.order_id;
    return query select true, 'already_processed', o.id, o.public_code; return;
  end if;

  select * into o from public.orders where stripe_payment_intent_id = p_payment_intent for update;
  insert into public.payment_events(stripe_event_id, event_type, payment_intent_id, order_id, payload_hash) values (p_event_id, p_event_type, p_payment_intent, o.id, p_payload_hash);
  if o.id is null then
    update public.payment_events set processing_status = 'ignored', processed_at = now(), error_message = 'order_not_found' where stripe_event_id = p_event_id;
    return query select false, 'order_not_found', null::uuid, null::text; return;
  end if;

  if p_event_type = 'payment_intent.succeeded' then
    if p_amount <> o.total_cents or upper(p_currency) <> o.currency then
      update public.orders set requires_review = true where id = o.id;
      update public.payment_events set processing_status = 'failed', processed_at = now(), error_message = 'amount_mismatch' where stripe_event_id = p_event_id;
      return query select false, 'amount_mismatch', o.id, o.public_code; return;
    end if;
    if o.payment_expires_at < now() or exists(select 1 from public.stock_reservations where order_id = o.id and (status <> 'active' or expires_at < now())) then
      update public.orders set payment_status = 'paid', requires_review = true where id = o.id;
      update public.payment_events set processing_status = 'processed', processed_at = now() where stripe_event_id = p_event_id;
      return query select false, 'late_payment_review', o.id, o.public_code; return;
    end if;
    target := 'confirmed'; pay := 'paid';
    update public.stock_reservations set status = 'converted', converted_order_id = o.id where order_id = o.id and status = 'active';
    update public.orders set status = target, payment_status = pay, confirmed_at = coalesce(confirmed_at, now()) where id = o.id;
    insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes)
    select oi.product_variant_id, 'venta', -oi.quantity, o.id, 'Venta confirmada por Stripe'
    from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
    where oi.order_id = o.id and pv.stock_tracking;
  elsif p_event_type = 'payment_intent.processing' then
    target := 'payment_processing'; pay := 'processing';
    update public.orders set status = target, payment_status = pay where id = o.id;
  elsif p_event_type in ('payment_intent.payment_failed', 'payment_intent.canceled') then
    target := 'cancelled'; pay := case when p_event_type like '%failed' then 'failed' else 'cancelled' end;
    update public.orders set status = target, payment_status = pay, cancelled_at = now(), cancellation_reason = p_event_type where id = o.id;
    update public.stock_reservations set status = 'released' where order_id = o.id and status = 'active';
  elsif p_event_type in ('charge.refunded', 'charge.refund.updated') then
    target := 'refunded'; pay := 'refunded';
    update public.orders set status = target, payment_status = pay where id = o.id;
    if not exists (select 1 from public.product_stock_movements where product_stock_movements.order_id = o.id and type = 'devolucion') then
      insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes)
      select oi.product_variant_id, 'devolucion', oi.quantity, o.id, 'Reembolso: estoque restituido'
      from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
      where oi.order_id = o.id and pv.stock_tracking;
    end if;
  else
    update public.payment_events set processing_status = 'ignored', processed_at = now() where stripe_event_id = p_event_id;
    return query select true, 'ignored', o.id, o.public_code; return;
  end if;

  insert into public.order_status_history(order_id, previous_status, new_status, source, reason) values (o.id, o.status, target, 'stripe_webhook', p_event_type);
  update public.payment_events set processing_status = 'processed', processed_at = now() where stripe_event_id = p_event_id;
  insert into public.audit_logs(action, entity_type, entity_id, new_data) values ('payment.event', 'orders', o.id::text, jsonb_build_object('event_type', p_event_type, 'payment_status', pay));
  return query select true, 'processed', o.id, o.public_code;
end;
$$;
