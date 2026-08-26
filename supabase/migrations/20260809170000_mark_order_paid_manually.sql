-- "Acciones operativas" solo permitía preparar/recoger/cancelar un pedido: no
-- había forma de registrar que un cliente pagó en efectivo en el obrador tras
-- un fallo de pago online. Esta función reproduce exactamente lo que hace
-- process_payment_event() en el camino de Stripe (convertir la reserva en
-- venta, mover el estoque, historial, auditoría), pero iniciada por staff en
-- vez de por un webhook -- así el pedido en efectivo queda idéntico a uno
-- pagado online: mismo estado, mismos movimientos de estoque, mismo correo
-- de confirmación (el trigger orders_notification_outbox ya existente se
-- dispara igual al cambiar status).

create or replace function public.mark_order_paid_manually(p_order_id uuid, p_reason text default null)
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
  if v_order.payment_status = 'paid' then
    return query select false, 'already_paid'; return;
  end if;
  if v_order.status in ('cancelled', 'refunded') then
    return query select false, 'order_cancelled'; return;
  end if;

  update public.stock_reservations
    set status = 'converted', converted_order_id = p_order_id
    where order_id = p_order_id and status = 'active';

  update public.orders
    set status = 'confirmed', payment_status = 'paid', confirmed_at = coalesce(confirmed_at, now())
    where id = p_order_id;

  insert into public.product_stock_movements (product_variant_id, type, quantity, order_id, notes, created_by)
  select oi.product_variant_id, 'venta', -oi.quantity, p_order_id, coalesce('Pago en efectivo registrado manualmente: ' || p_reason, 'Pago en efectivo registrado manualmente'), (select auth.uid())
  from public.order_items oi join public.product_variants pv on pv.id = oi.product_variant_id
  where oi.order_id = p_order_id and pv.stock_tracking;

  insert into public.order_status_history (order_id, previous_status, new_status, actor_id, source, reason)
  values (p_order_id, v_order.status, 'confirmed', (select auth.uid()), 'admin', coalesce(p_reason, 'Pago en efectivo registrado manualmente'));

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data, new_data, metadata)
  values ((select auth.uid()), 'order.marked_paid_manually', 'orders', p_order_id::text, jsonb_build_object('payment_status', v_order.payment_status), jsonb_build_object('payment_status', 'paid'), jsonb_build_object('reason', p_reason));

  return query select true, 'paid';
end;
$$;
revoke all on function public.mark_order_paid_manually(uuid, text) from public;
grant execute on function public.mark_order_paid_manually(uuid, text) to authenticated;
