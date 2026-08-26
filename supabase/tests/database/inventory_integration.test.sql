begin;
select plan(22);

-- ---------------------------------------------------------------------------
-- Preparación: staff owner, familia/producto con una variante con
-- stock_tracking y una sin, punto de recogida.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-inventory@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000801', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

insert into public.product_families (id, name, slug, status) values ('80000000-0000-0000-0000-000000000001', 'Familia inventario', 'familia-inventario', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('80000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'Producto inventario', 'producto-inventario', 'Para pruebas de inventario', 'draft');
insert into public.product_production_weekdays (product_id, weekday, is_active) select '80000000-0000-0000-0000-000000000002', g, true from generate_series(1, 7) g;
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, low_stock_threshold)
values ('80000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', 'Congelado', 1200, 10.00, 'active', true, 5);
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking)
values ('80000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000002', 'Pan del día', 400, 4.00, 'active', false);
update public.products set status = 'active' where id = '80000000-0000-0000-0000-000000000002';

insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('80000000-0000-0000-0000-000000000005', 'Punto inventario', 'punto-inventario', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '80000000-0000-0000-0000-000000000005', g, '10:00', '14:30' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '80000000-0000-0000-0000-000000000005', g, 100 from generate_series(1, 7) g;

-- ---------------------------------------------------------------------------
-- register_stock_movement(): tipo 'produccion'
-- ---------------------------------------------------------------------------

select is(
  (select stock_quantity from public.product_variants where id = '80000000-0000-0000-0000-000000000003'),
  0, 'la variante empieza sin stock'
);

select lives_ok(
  $$ select public.register_stock_movement('80000000-0000-0000-0000-000000000003', 'produccion', 20, 'Lote de prueba') $$,
  'una producción terminada se registra correctamente'
);

select is(
  (select stock_quantity from public.product_variants where id = '80000000-0000-0000-0000-000000000003'),
  20, 'el trigger aplica la producción al stock_quantity'
);

select throws_ok(
  $$ select public.register_stock_movement('80000000-0000-0000-0000-000000000003', 'produccion', -5, 'inválido') $$,
  '23514', 'entrada_requires_positive_quantity', 'una producción con cantidad negativa se rechaza'
);

-- ---------------------------------------------------------------------------
-- variant_stock_status(): reservado/disponible en vivo
-- ---------------------------------------------------------------------------

-- stock_reservations no tiene grants de escritura para ningún rol (toda
-- mutación real pasa por create_checkout_order/expire_stock_reservations/
-- process_payment_event) -- para fijar un estado de fixture hay que
-- insertar/actualizar como superusuario, igual que hace availability.test.sql
-- al comprobar que ni siquiera owner tiene INSERT directo.
reset role;
insert into public.stock_reservations (token, session_key, product_variant_id, pickup_point_id, collection_date, quantity, status, expires_at)
values ('inv-test-token-1', 'inv-test-session-1', '80000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000005', current_date + 10, 6, 'active', now() + interval '15 minutes');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select results_eq(
  $$ select reserved_quantity, available_quantity, stock_state from public.variant_stock_status('80000000-0000-0000-0000-000000000002') where variant_id = '80000000-0000-0000-0000-000000000003' $$,
  $$ values (6, 14, 'disponible'::text) $$,
  'con 20 en stock y 6 reservadas, disponible=14 y el estado es correcto'
);

reset role;
update public.stock_reservations set quantity = 16 where token = 'inv-test-token-1';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select results_eq(
  $$ select reserved_quantity, available_quantity, stock_state from public.variant_stock_status('80000000-0000-0000-0000-000000000002') where variant_id = '80000000-0000-0000-0000-000000000003' $$,
  $$ values (16, 4, 'stock_bajo'::text) $$,
  'disponible por debajo del umbral (5) marca stock_bajo'
);

select is(
  (select stock_state from public.variant_stock_status('80000000-0000-0000-0000-000000000002') where variant_id = '80000000-0000-0000-0000-000000000004'),
  'no_controlado', 'la variante sin stock_tracking se marca como no_controlado'
);

-- Libera la reserva para dejar la variante disponible antes de la venta.
reset role;
update public.stock_reservations set status = 'released' where token = 'inv-test-token-1';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select results_eq(
  $$ select reserved_quantity, available_quantity, stock_state from public.variant_stock_status('80000000-0000-0000-0000-000000000002') where variant_id = '80000000-0000-0000-0000-000000000003' $$,
  $$ values (0, 20, 'disponible'::text) $$,
  'al liberar la reserva, disponible vuelve a subir'
);

-- ---------------------------------------------------------------------------
-- Venta real vía create_staff_order() -> movimiento 'venta' con order_id.
-- ---------------------------------------------------------------------------

select is(
  (select ok from public.create_staff_order('[{"variant_id":"80000000-0000-0000-0000-000000000003","quantity":3}]'::jsonb, '80000000-0000-0000-0000-000000000005', current_date + 10, 'Cliente Inventario', '600300001', null, 'phone', 'paid', null)),
  true, 'la venta manual se crea correctamente'
);

select is(
  (select stock_quantity from public.product_variants where id = '80000000-0000-0000-0000-000000000003'),
  17, 'la venta descuenta 3 unidades del stock físico'
);

-- ---------------------------------------------------------------------------
-- variant_stock_timeline(): cronología con stock_before/after y eventos de
-- reserva.
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::integer from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003', 50) where category = 'reservation' and type = 'reserva'),
  1, 'la línea de tiempo incluye el evento de reserva'
);

select is(
  (select count(*)::integer from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003', 50) where category = 'reservation' and type = 'liberacion'),
  1, 'la línea de tiempo incluye el evento de liberación'
);

select is(
  (select stock_after from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003', 50) where category = 'stock' and type = 'venta'),
  17, 'el movimiento de venta refleja el stock posterior correcto'
);

select is(
  (select stock_before from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003', 50) where category = 'stock' and type = 'venta'),
  20, 'el movimiento de venta refleja el stock anterior correcto'
);

select is(
  (select order_id from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003', 50) where category = 'stock' and type = 'venta'),
  (select id from public.orders where customer_phone = '600300001'),
  'el movimiento de venta enlaza con el pedido que lo generó'
);

-- ---------------------------------------------------------------------------
-- inventory_dashboard_alerts()
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ select public.register_stock_movement('80000000-0000-0000-0000-000000000003', 'merma', -2, 'Rotura') $$,
  'la merma se registra correctamente'
);

reset role;
insert into public.stock_reservations (token, session_key, product_variant_id, pickup_point_id, collection_date, quantity, status, expires_at)
values ('inv-test-token-2', 'inv-test-session-2', '80000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000005', current_date + 10, 1, 'active', now() + interval '5 minutes');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select is(
  (select recent_mermas_count from public.inventory_dashboard_alerts()),
  1, 'la alerta cuenta la merma reciente'
);

select is(
  (select expiring_reservations_count from public.inventory_dashboard_alerts()),
  1, 'la alerta cuenta la reserva que expira pronto'
);

select is(
  (select paid_pending_prep_count from public.inventory_dashboard_alerts()),
  1, 'la alerta cuenta el pedido pagado confirmado pendiente de preparar'
);

-- ---------------------------------------------------------------------------
-- RLS: ningún cliente/anónimo puede llamar a las funciones nuevas.
-- ---------------------------------------------------------------------------

reset role;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-inventory@example.test', '', now(), '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000802', true);

select throws_ok(
  $$ select * from public.variant_stock_status() $$,
  '42501', null, 'un cliente no puede consultar variant_stock_status'
);
select throws_ok(
  $$ select * from public.variant_stock_timeline('80000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'un cliente no puede consultar variant_stock_timeline'
);
select throws_ok(
  $$ select * from public.inventory_dashboard_alerts() $$,
  '42501', null, 'un cliente no puede consultar inventory_dashboard_alerts'
);

reset role;
select * from finish();
rollback;
