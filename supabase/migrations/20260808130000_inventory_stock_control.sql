-- Control de estoque vinculado a productos y pedidos (Documento funcional del
-- cliente, sección 5: "todos los pedidos deben terminar en un único sistema"
-- también implica que las ventas descuenten un inventario real). Este motor
-- es voluntario por variante (product_variants.stock_tracking): el pan
-- artesanal diario sigue gobernado únicamente por production_dates/capacidad
-- (Fase de disponibilidad, no tocada aquí); el estoque es para productos con
-- inventario físico real -- congelados, envasados, etc. (sección 3:
-- "Empanadas colombianas congeladas", "Coxinhas congeladas"...).
--
-- Ledger inmutable (nunca se actualiza ni se borra una fila, igual que
-- order_items) + una columna caché (product_variants.stock_quantity)
-- mantenida por trigger, para que el admin pueda leer el estoque actual sin
-- agregar el ledger completo en cada consulta.

create type public.stock_movement_type as enum ('entrada', 'venta', 'merma', 'ajuste', 'devolucion');

alter table public.product_variants add column stock_tracking boolean not null default false;
alter table public.product_variants add column stock_quantity integer not null default 0;

create table public.product_stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  type public.stock_movement_type not null,
  quantity integer not null check (quantity <> 0),
  order_id uuid references public.orders(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.product_stock_movements is 'Ledger inmutable de entradas/salidas de estoque. stock_quantity en product_variants es una caché mantenida por trigger a partir de esta tabla -- nunca editar stock_quantity directamente.';
comment on column public.product_stock_movements.quantity is 'Delta firmado: positivo aumenta el estoque (entrada, devolución, ajuste positivo), negativo lo reduce (venta, merma, ajuste negativo).';
create index product_stock_movements_variant_idx on public.product_stock_movements(product_variant_id, created_at desc);
create index product_stock_movements_order_idx on public.product_stock_movements(order_id) where order_id is not null;

-- Ledger de solo inserción: cualquier corrección se registra como un nuevo
-- movimiento de tipo 'ajuste', nunca reescribiendo el historial.
create or replace function app_private.forbid_stock_movement_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'stock_movements_immutable' using errcode = '0A000';
end;
$$;
create trigger product_stock_movements_forbid_update before update on public.product_stock_movements for each row execute function app_private.forbid_stock_movement_change();
create trigger product_stock_movements_forbid_delete before delete on public.product_stock_movements for each row execute function app_private.forbid_stock_movement_change();

create or replace function app_private.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.product_variants set stock_quantity = stock_quantity + new.quantity where id = new.product_variant_id;
  return new;
end;
$$;
create trigger product_stock_movements_apply after insert on public.product_stock_movements for each row execute function app_private.apply_stock_movement();

alter table public.product_stock_movements enable row level security;
revoke all on public.product_stock_movements from anon, authenticated;
create policy product_stock_movements_staff_read on public.product_stock_movements for select to authenticated
  using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
grant select on public.product_stock_movements to authenticated;
-- Sin grants de insert/update/delete: toda escritura pasa por register_stock_movement().

do $$ begin
  execute format('create trigger %I after insert or update or delete on public.%I for each row execute function app_private.audit_catalog_change()', 'product_stock_movements_audit', 'product_stock_movements');
end $$;

-- Entradas/mermas/ajustes manuales del admin u operador. La venta y la
-- devolución las genera el propio sistema (process_payment_event/
-- cancel_order más abajo): un cliente autenticado nunca puede insertarlas
-- directamente con esta función.
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
  v_signed_quantity integer;
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

  if p_type = 'entrada' and p_quantity < 0 then
    raise exception 'entrada_requires_positive_quantity' using errcode = '23514';
  elsif p_type = 'merma' and p_quantity > 0 then
    raise exception 'merma_requires_negative_quantity' using errcode = '23514';
  end if;

  v_signed_quantity := p_quantity;

  insert into public.product_stock_movements (product_variant_id, type, quantity, notes, created_by)
  values (p_product_variant_id, p_type, v_signed_quantity, p_notes, (select auth.uid()))
  returning * into v_result;

  return v_result;
end;
$$;
revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, integer, text) from public;
grant execute on function public.register_stock_movement(uuid, public.stock_movement_type, integer, text) to authenticated;

-- Hook de venta/devolución automática, añadido a las dos funciones ya
-- existentes que cambian el estado de un pedido. Mismo comportamiento
-- previo en todo lo demás -- create or replace conserva la firma exacta.

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
    insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes)
    select oi.product_variant_id, 'devolucion', oi.quantity, o.id, 'Reembolso: estoque restituido'
    from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
    where oi.order_id = o.id and pv.stock_tracking;
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

  update public.orders set status = 'cancelled' where id = p_order_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data, new_data, metadata)
  values ((select auth.uid()), 'order.cancelled', 'orders', p_order_id::text, jsonb_build_object('status', v_order.status), jsonb_build_object('status', 'cancelled'), jsonb_build_object('reason', p_reason));

  return query select true, 'cancelled';
end;
$$;
