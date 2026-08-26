begin;
select plan(15);

-- ---------------------------------------------------------------------------
-- Preparación: owner, admin, un cliente normal, producto con stock_tracking
-- y un punto de recogida.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('96000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-pago@example.test', '', now(), '{}', '{}', now(), now()),
  ('96000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operador-pago@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('96000000-0000-0000-0000-000000000001', 'owner');
insert into public.user_roles (user_id, role) values ('96000000-0000-0000-0000-000000000002', 'operator');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000001', true);

insert into public.product_families (id, name, slug, status) values ('96000000-0000-0000-0000-000000000010', 'Familia pago manual', 'familia-pago-manual', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('96000000-0000-0000-0000-000000000011', '96000000-0000-0000-0000-000000000010', 'Producto pago manual', 'producto-pago-manual', 'Para pruebas de pago manual', 'draft');
insert into public.product_production_weekdays (product_id, weekday, is_active) select '96000000-0000-0000-0000-000000000011', g, true from generate_series(1, 7) g;
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity) values ('96000000-0000-0000-0000-000000000012', '96000000-0000-0000-0000-000000000011', 'Única', 800, 10.00, 'active', true, 10);
update public.products set status = 'active' where id = '96000000-0000-0000-0000-000000000011';
insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('96000000-0000-0000-0000-000000000013', 'Punto pago manual', 'punto-pago-manual', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '96000000-0000-0000-0000-000000000013', g, '10:00', '14:30' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '96000000-0000-0000-0000-000000000013', g, 50 from generate_series(1, 7) g;

-- ---------------------------------------------------------------------------
-- Pedido A: checkout normal, todavía sin pagar (pending_payment + reserva activa).
-- ---------------------------------------------------------------------------

reset role;
set local role anon;
select is(
  (select ok from public.create_checkout_order(
    '[{"variant_id":"96000000-0000-0000-0000-000000000012","quantity":2}]'::jsonb,
    '96000000-0000-0000-0000-000000000013', current_date + 10, 'sesion-pago-manual-a', null,
    'Cliente Efectivo', 'efectivo@example.test', '600300001', '2026-08', '2026-08', false, 'hash-pago-manual-a'
  )),
  true, 'pedido A (sin pagar) se crea correctamente'
);

reset role;
select set_config('test.pedido_a_id', (select id::text from public.orders where customer_phone = '600300001'), true);
select is(
  (select status::text from public.orders where id = current_setting('test.pedido_a_id')::uuid),
  'pending_payment', 'pedido A empieza pendiente de pago'
);
select is(
  (select count(*)::integer from public.stock_reservations where order_id = current_setting('test.pedido_a_id')::uuid and status = 'active'),
  1, 'pedido A tiene una reserva activa de checkout'
);

-- ---------------------------------------------------------------------------
-- Un operator no puede registrar el pago manual (solo owner/admin).
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ select public.mark_order_paid_manually(current_setting('test.pedido_a_id')::uuid, 'Efectivo en tienda') $$,
  '42501', null, 'un operator no puede marcar un pedido como pagado manualmente'
);

-- ---------------------------------------------------------------------------
-- Un owner sí puede: el pedido queda igual que si Stripe lo hubiera confirmado.
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000001', true);

select is(
  (select ok from public.mark_order_paid_manually(current_setting('test.pedido_a_id')::uuid, 'Efectivo en tienda')),
  true, 'un owner puede registrar el pago en efectivo'
);
select is(
  (select status::text from public.orders where id = current_setting('test.pedido_a_id')::uuid),
  'confirmed', 'el pedido queda confirmado tras registrar el pago manual'
);
select is(
  (select payment_status::text from public.orders where id = current_setting('test.pedido_a_id')::uuid),
  'paid', 'el pedido queda pagado tras registrar el pago manual'
);
select is(
  (select status::text from public.stock_reservations where order_id = current_setting('test.pedido_a_id')::uuid),
  'converted', 'la reserva original se convierte en venta, igual que con Stripe'
);
select is(
  (select count(*)::integer from public.product_stock_movements where order_id = current_setting('test.pedido_a_id')::uuid and type = 'venta' and quantity = -2),
  1, 'se registra el movimiento de venta correspondiente'
);
select is(
  (select count(*)::integer from public.order_status_history where order_id = current_setting('test.pedido_a_id')::uuid and new_status = 'confirmed' and source = 'admin'),
  1, 'queda constancia en el historial de que fue un admin quien confirmó el pago'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_id = current_setting('test.pedido_a_id')::text and action = 'order.marked_paid_manually'),
  1, 'queda constancia en auditoría'
);

-- ---------------------------------------------------------------------------
-- Idempotencia y guardas.
-- ---------------------------------------------------------------------------

select is(
  (select reason from public.mark_order_paid_manually(current_setting('test.pedido_a_id')::uuid, null)),
  'already_paid', 'no se puede volver a marcar como pagado un pedido ya pagado'
);
select is(
  (select reason from public.mark_order_paid_manually(gen_random_uuid(), null)),
  'not_found', 'un pedido inexistente no se puede marcar como pagado'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000001', true);
select is(
  (select ok from public.create_staff_order('[{"variant_id":"96000000-0000-0000-0000-000000000012","quantity":1}]'::jsonb, '96000000-0000-0000-0000-000000000013', current_date + 11, 'Cliente Cancelado', '600300002', null, 'in_person', 'pending', null)),
  true, 'pedido B (para cancelar) se crea correctamente'
);
select public.cancel_order((select id from public.orders where customer_phone = '600300002'), 'Cancelado para la prueba');
select is(
  (select reason from public.mark_order_paid_manually((select id from public.orders where customer_phone = '600300002'), null)),
  'order_cancelled', 'un pedido cancelado no se puede marcar como pagado'
);

select * from finish();
rollback;
