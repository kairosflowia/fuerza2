begin;
select plan(20);

-- ---------------------------------------------------------------------------
-- Preparación: producto con una variante normal y otra con stock_tracking,
-- punto de recogida, y el corte real de 48h (mismo ajuste que gobierna
-- request_order_cancellation()).
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-cancel@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000501', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);

insert into public.product_families (id, name, slug, status) values ('50000000-0000-0000-0000-000000000001', 'Familia cancelación', 'familia-cancelacion', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('50000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Producto cancelación', 'producto-cancelacion', 'Para pruebas de cancelación', 'draft');
insert into public.product_production_weekdays (product_id, weekday, is_active) select '50000000-0000-0000-0000-000000000002', g, true from generate_series(1, 7) g;
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity)
values ('50000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Congelado', 1500, 10.00, 'active', true, 5);
update public.products set status = 'active' where id = '50000000-0000-0000-0000-000000000002';

insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('50000000-0000-0000-0000-000000000004', 'Punto cancelación', 'punto-cancelacion', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '50000000-0000-0000-0000-000000000004', g, '10:00', '14:30' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '50000000-0000-0000-0000-000000000004', g, 100 from generate_series(1, 7) g;

insert into public.app_settings (key, value, is_public, updated_by)
values
  ('availability.cutoff_time', '"10:00:00"'::jsonb, true, '00000000-0000-0000-0000-000000000501'),
  ('availability.cutoff_days_before', '2'::jsonb, true, '00000000-0000-0000-0000-000000000501')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = excluded.updated_by;

select has_function('public', 'request_order_cancellation', array['text', 'text', 'text'], 'la función de cancelación del cliente existe');
select has_table('public', 'store_credits', 'la tabla de vales existe');
select ok((select relrowsecurity from pg_class where oid = 'public.store_credits'::regclass), 'store_credits tiene RLS habilitada');

-- ---------------------------------------------------------------------------
-- Pedido A: confirmado y pagado, para recoger dentro de 10 días -- a más de
-- 48h de antelación en el momento de cancelar. Debe resolverse como
-- reembolso íntegro (refund_due), sin vale, y con devolución de estoque.
-- ---------------------------------------------------------------------------

select is(
  (select ok from public.create_staff_order('[{"variant_id":"50000000-0000-0000-0000-000000000003","quantity":2}]'::jsonb, '50000000-0000-0000-0000-000000000004', current_date + 10, 'Cliente Reembolso', '600200001', null, 'phone', 'paid', null)),
  true, 'pedido A (a más de 48h) se crea correctamente'
);
reset role;
update public.orders set lookup_token_hash = 'hash-reembolso-test', stripe_payment_intent_id = 'pi_test_refund' where customer_phone = '600200001';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);

select results_eq(
  $$ select ok, reason from public.request_order_cancellation((select public_code from public.orders where customer_phone='600200001'), 'hash-incorrecto', null) $$,
  $$ values (false, 'not_found'::text) $$,
  'un token equivocado no permite cancelar'
);

select results_eq(
  $$ select ok, resolution, voucher_code from public.request_order_cancellation((select public_code from public.orders where customer_phone='600200001'), 'hash-reembolso-test', 'Ya no lo necesito') $$,
  $$ values (true, 'refund_due'::text, null::text) $$,
  'cancelar con más de 48h de antelación resuelve en reembolso íntegro, sin vale'
);

select is(
  (select status from public.orders where customer_phone = '600200001'),
  'cancelled'::public.order_status, 'el pedido A queda cancelled'
);
select is(
  (select count(*)::integer from public.product_stock_movements where order_id = (select id from public.orders where customer_phone = '600200001') and type = 'devolucion' and quantity = 2),
  1, 'cancelar el pedido A devuelve las 2 unidades de estoque de inmediato'
);
select is(
  (select count(*)::integer from public.order_status_history where order_id = (select id from public.orders where customer_phone = '600200001') and new_status = 'cancelled' and source = 'customer'),
  1, 'el historial registra la cancelación con origen customer'
);
select results_eq(
  $$ select ok, reason from public.request_order_cancellation((select public_code from public.orders where customer_phone='600200001'), 'hash-reembolso-test', null) $$,
  $$ values (false, 'already_cancelled'::text) $$,
  'un pedido ya cancelado no puede volver a cancelarse'
);

-- Guarda de idempotencia en process_payment_event: cuando llega el webhook
-- charge.refunded para el mismo pedido, el estoque NO se devuelve una
-- segunda vez (ya lo devolvió request_order_cancellation).
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select public.process_payment_event('evt_test_refund', 'charge.refunded', 'pi_test_refund', 1500, 'eur', 'hash_test_refund');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select is(
  (select status from public.orders where customer_phone = '600200001'),
  'refunded'::public.order_status, 'el webhook de reembolso confirma el estado final refunded'
);
select is(
  (select count(*)::integer from public.product_stock_movements where order_id = (select id from public.orders where customer_phone = '600200001') and type = 'devolucion'),
  1, 'el webhook de reembolso NO duplica la devolución de estoque ya hecha al cancelar'
);

-- ---------------------------------------------------------------------------
-- Pedido B: confirmado y pagado, pero se fuerza collection_date a hoy para
-- simular que ya quedan menos de 48h en el momento de cancelar. Debe emitir
-- un vale por el importe íntegro en vez de reembolso.
-- ---------------------------------------------------------------------------

select is(
  (select ok from public.create_staff_order('[{"variant_id":"50000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '50000000-0000-0000-0000-000000000004', current_date + 11, 'Cliente Vale', '600200002', null, 'whatsapp', 'paid', null)),
  true, 'pedido B se crea correctamente'
);
reset role;
update public.orders set lookup_token_hash = 'hash-vale-test', collection_date = current_date where customer_phone = '600200002';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);

select is(
  (select ok from public.request_order_cancellation((select public_code from public.orders where customer_phone='600200002'), 'hash-vale-test', null)),
  true, 'cancelar el pedido B (a menos de 48h) tiene éxito'
);
select is(
  (select resolution from public.request_order_cancellation('no-existe', 'no-existe', null)),
  null, 'un código público inexistente no resuelve nada (sanity check de not_found)'
);
select is(
  (select count(*)::integer from public.store_credits where issued_from_order_id = (select id from public.orders where customer_phone = '600200002') and amount_cents = (select total_cents from public.orders where customer_phone = '600200002') and status = 'active'),
  1, 'cancelar con menos de 48h emite un vale activo por el importe íntegro del pedido'
);

-- ---------------------------------------------------------------------------
-- Pedido C: todavía sin pagar (pending_payment). Se cancela sin política de
-- reembolso/vale: no hay nada cobrado que gestionar.
-- ---------------------------------------------------------------------------

select is(
  (select ok from public.create_checkout_order(
    '[{"variant_id":"50000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb,
    '50000000-0000-0000-0000-000000000004', current_date + 10, 'sesion-cancel-c', null,
    'Cliente Sin Pagar', 'sinpagar@example.test', '600200003', '2026-08', '2026-08', false, 'hash-sin-pagar-test'
  )),
  true, 'pedido C (sin pagar) se crea correctamente'
);
select results_eq(
  $$ select ok, resolution from public.request_order_cancellation((select public_code from public.orders where customer_phone='600200003'), 'hash-sin-pagar-test', null) $$,
  $$ values (true, 'cancelled_unpaid'::text) $$,
  'cancelar un pedido todavía no pagado no genera reembolso ni vale'
);

-- ---------------------------------------------------------------------------
-- Pedido D: ya en 'ready' (el obrador ya lo preparó) -- demasiado tarde para
-- que el propio cliente lo cancele por este camino.
-- ---------------------------------------------------------------------------

select is(
  (select ok from public.create_staff_order('[{"variant_id":"50000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '50000000-0000-0000-0000-000000000004', current_date + 12, 'Cliente Listo', '600200004', null, 'in_person', 'paid', null)),
  true, 'pedido D se crea correctamente'
);
reset role;
update public.orders set lookup_token_hash = 'hash-listo-test', status = 'ready' where customer_phone = '600200004';
select set_config('test.order_d_code', (select public_code from public.orders where customer_phone = '600200004'), true);
set local role anon;
select results_eq(
  $$ select ok, reason from public.request_order_cancellation(current_setting('test.order_d_code'), 'hash-listo-test', null) $$,
  $$ values (false, 'too_late_to_cancel'::text) $$,
  'un pedido ya preparado (ready) no se puede cancelar por este camino, ni siquiera anon con el token correcto'
);

select * from finish();
rollback;
