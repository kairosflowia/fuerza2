begin;
select plan(70);

-- ---------------------------------------------------------------------------
-- Preparación: familia, producto, variante, punto, ventanas, capacidad,
-- días de producción, ajustes de disponibilidad.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-avail@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-avail-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-avail-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operator-avail@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-0000-0000-000000000401', 'owner'),
  ('00000000-0000-0000-0000-000000000404', 'operator');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);

insert into public.product_families (id, name, slug, status) values ('40000000-0000-0000-0000-000000000001', 'Familia disponibilidad', 'familia-disponibilidad', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Producto disponibilidad', 'producto-disponibilidad', 'Para pruebas', 'draft');
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status) values ('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Única', 500, 4.00, 'active');
update public.products set status = 'active' where id = '40000000-0000-0000-0000-000000000002';
insert into public.product_production_weekdays (product_id, weekday, is_active) select '40000000-0000-0000-0000-000000000002', g, true from generate_series(1, 7) g;

insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('40000000-0000-0000-0000-000000000004', 'Punto disponibilidad', 'punto-disponibilidad', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '40000000-0000-0000-0000-000000000004', g, '09:00', '18:00' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '40000000-0000-0000-0000-000000000004', g, 100 from generate_series(1, 7) g;

insert into public.production_dates (id, product_variant_id, production_date, total_capacity, status)
values ('40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', current_date + 10, 5, 'open');

insert into public.app_settings (key, value, is_public, updated_by)
values
  ('availability.cutoff_time', '"23:59"'::jsonb, false, '00000000-0000-0000-0000-000000000401'),
  ('availability.cutoff_days_before', '0'::jsonb, false, '00000000-0000-0000-0000-000000000401'),
  ('availability.reservation_duration_seconds', '900'::jsonb, false, '00000000-0000-0000-0000-000000000401'),
  ('availability.low_stock_threshold', '2'::jsonb, false, '00000000-0000-0000-0000-000000000401')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = excluded.updated_by;

-- 1. Disponible desde el principio, con la capacidad completa.
select results_eq(
  $$ select status, reason, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  $$ values ('available'::text, 'available'::text, null::integer) $$,
  'con 5 de capacidad y umbral 2, el estado es available sin cantidad expuesta'
);

-- 2. Cantidad inválida.
select is((select ok from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10, 0, 'sesion-1')), false, 'cantidad cero es rechazada');
select is((select reason from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10, 0, 'sesion-1')), 'invalid_quantity', 'motivo invalid_quantity');

-- 3. Reserva dentro de la capacidad.
select is((select ok from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10, 3, 'sesion-2')), true, 'reserva de 3 unidades sobre 5 tiene éxito');

-- 4. Bajo el umbral de low_stock (quedan 2, umbral 2).
select results_eq(
  $$ select status, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  $$ values ('low_stock'::text, 2::integer) $$,
  'con 2 unidades restantes y umbral 2, el estado es low_stock con cantidad expuesta'
);

-- 5. Pedir más de lo que queda falla con sold_out y no reserva nada.
select is((select reason from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10, 3, 'sesion-3')), 'sold_out', 'pedir 3 cuando solo quedan 2 falla con sold_out');
select is((select count(*)::integer from public.stock_reservations where session_key = 'sesion-3'), 0, 'la reserva rechazada no crea ninguna fila');

-- 6. No se puede reducir la capacidad por debajo de lo ya comprometido (3 reservadas).
select throws_ok(
  $$ update public.production_dates set total_capacity = 2 where id = '40000000-0000-0000-0000-000000000005' $$,
  '23514', null, 'reducir la capacidad por debajo de lo comprometido se rechaza'
);

-- 7. reserved_for_subscriptions no puede superar total_capacity.
select throws_ok(
  $$ update public.production_dates set reserved_for_subscriptions = 999 where id = '40000000-0000-0000-0000-000000000005' $$,
  '23514', null, 'reserved_for_subscriptions no puede superar total_capacity'
);

-- 8. Expiración: una reserva creada con duración negativa nace ya vencida.
insert into public.production_dates (product_variant_id, production_date, total_capacity, status)
values ('40000000-0000-0000-0000-000000000003', current_date + 11, 5, 'open');
update public.app_settings set value = '-10'::jsonb where key = 'availability.reservation_duration_seconds';
select is((select ok from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 11, 5, 'sesion-expira')), true, 'la reserva de prueba de expiración se crea');
update public.app_settings set value = '900'::jsonb where key = 'availability.reservation_duration_seconds';

select is((select public.expire_stock_reservations()) >= 1, true, 'expire_stock_reservations marca al menos una reserva vencida');
select is((select status::text from public.stock_reservations where session_key = 'sesion-expira'), 'expired', 'la reserva vencida queda en estado expired');

-- 9. Una reserva expirada no cuenta: la fecha completa vuelve a estar disponible.
select results_eq(
  $$ select status from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 11) $$,
  $$ values ('available'::text) $$,
  'una reserva expirada libera la capacidad de inmediato'
);

-- 10. Idempotencia de la propia función de expiración.
select is((select public.expire_stock_reservations()), 0, 'volver a expirar no encuentra nada nuevo que marcar');

-- 11. Prolongamiento: solo una vez, solo si está activa.
select ok(
  (select token from public.stock_reservations where session_key = 'sesion-2') is not null,
  'la reserva activa de la sesión 2 tiene token'
);
select is(
  (select ok from public.extend_stock_reservation((select token from public.stock_reservations where session_key = 'sesion-2'))),
  true, 'primera extensión tiene éxito'
);
select is(
  (select reason from public.extend_stock_reservation((select token from public.stock_reservations where session_key = 'sesion-2'))),
  'already_extended', 'una segunda extensión de la misma reserva se rechaza'
);
-- Reserva fresca cuyo expires_at ya pasó pero cuyo estado todavía es
-- 'active' (todavía no ha pasado por el barrido de expire_stock_reservations):
-- es el único caso real en el que extend_stock_reservation debe responder
-- 'already_expired' en lugar de 'not_active'.
insert into public.production_dates (product_variant_id, production_date, total_capacity, status)
values ('40000000-0000-0000-0000-000000000003', current_date + 13, 5, 'open');
update public.app_settings set value = '-10'::jsonb where key = 'availability.reservation_duration_seconds';
select is((select ok from public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 13, 1, 'sesion-vencida-sin-barrer')), true, 'segunda reserva de prueba, todavía sin barrer, se crea');
update public.app_settings set value = '900'::jsonb where key = 'availability.reservation_duration_seconds';
select is(
  (select reason from public.extend_stock_reservation((select token from public.stock_reservations where session_key = 'sesion-vencida-sin-barrer'))),
  'already_expired', 'prolongar una reserva cuyo plazo ya pasó pero que aún no ha sido barrida responde already_expired'
);

-- 12. Conversión en encomienda: snapshot correcto e idempotencia.
select ok(
  (select ok from public.convert_reservation_to_order((select token from public.stock_reservations where session_key = 'sesion-2'), 'cliente@example.test', null)),
  'la conversión de una reserva activa tiene éxito'
);
select is(
  (select unit_price_cents from public.order_items oi join public.orders o on o.id = oi.order_id where o.guest_email = 'cliente@example.test'),
  500, 'el precio se copia como snapshot en el momento de la conversión'
);
select is(
  (select status::text from public.stock_reservations where session_key = 'sesion-2'),
  'converted', 'la reserva convertida cambia de estado'
);
select is(
  (select reason from public.convert_reservation_to_order((select token from public.stock_reservations where session_key = 'sesion-2'), 'cliente@example.test', null)),
  'already_converted', 'repetir la conversión con el mismo token es idempotente'
);
select is(
  (select count(*)::integer from public.orders where guest_email = 'cliente@example.test'),
  1, 'la repetición no duplica el pedido'
);

-- 13. order_items es inmutable: ni siquiera hay concesión de UPDATE para
--     ningún rol (solo select), y el trigger app_private.forbid_order_item_update
--     queda como segunda barrera si alguna migración futura concediera UPDATE
--     por error.
select throws_ok(
  $$ update public.order_items set quantity = 99 where order_id = (select id from public.orders where guest_email = 'cliente@example.test') $$,
  '42501', null, 'order_items no admite modificaciones: no hay concesión de UPDATE para ningún rol'
);

-- 14. Cancelación: solo owner/admin, y no se puede cancelar dos veces.
select is(
  (select ok from public.cancel_order((select id from public.orders where guest_email = 'cliente@example.test'), 'prueba')),
  true, 'owner puede cancelar el pedido'
);
select is(
  (select reason from public.cancel_order((select id from public.orders where guest_email = 'cliente@example.test'), 'prueba')),
  'already_cancelled', 'cancelar dos veces se rechaza'
);

-- 15. Tras cancelar, la capacidad vuelve a estar disponible (el pedido cancelado deja de contar).
select results_eq(
  $$ select status from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  $$ values ('available'::text) $$,
  'cancelar el pedido libera capacidad de inmediato'
);

-- 16. Cierre global bloquea con el motivo correcto.
insert into public.global_closures (starts_on, ends_on, created_by) values (current_date + 20, current_date + 20, '00000000-0000-0000-0000-000000000401');
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 20)),
  'global_closure', 'un cierre global produce el motivo global_closure'
);

-- 17. Excepción de "cerrado" en el punto produce point_closed, no global_closure.
insert into public.pickup_point_exceptions (pickup_point_id, exception_date, type, created_by) values ('40000000-0000-0000-0000-000000000004', current_date + 21, 'closed', '00000000-0000-0000-0000-000000000401');
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 21)),
  'point_closed', 'una excepción de cierre del punto produce point_closed'
);

-- 18. Producto no aceptado en el punto.
insert into public.production_dates (product_variant_id, production_date, total_capacity, status)
values ('40000000-0000-0000-0000-000000000003', current_date + 12, 20, 'open');
insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('40000000-0000-0000-0000-000000000006', 'Punto restringido', 'punto-restringido', 'external', 'active', true, false);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '40000000-0000-0000-0000-000000000006', g, '09:00', '18:00' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '40000000-0000-0000-0000-000000000006', g, 10 from generate_series(1, 7) g;
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', current_date + 12)),
  'product_not_allowed_at_point', 'un punto que no acepta el producto produce product_not_allowed_at_point'
);

-- 19. Capacidad del punto no configurada para ese día de la semana.
delete from public.pickup_point_capacity_defaults where pickup_point_id = '40000000-0000-0000-0000-000000000006';
insert into public.product_pickup_points (product_id, pickup_point_id, is_available) values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', true);
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', current_date + 12)),
  'point_capacity_not_configured', 'ausencia de fila de capacidad produce point_capacity_not_configured, no cero silencioso'
);

-- 20. Producto no producido ese día de la semana.
delete from public.product_production_weekdays where product_id = '40000000-0000-0000-0000-000000000002' and weekday = extract(isodow from current_date + 30)::smallint;
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 30)),
  'not_produced_that_day', 'un día sin producción configurada produce not_produced_that_day'
);

-- 21. Sin production_date para esa fecha.
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 40)),
  'production_not_open', 'sin fila de production_dates el motivo es production_not_open'
);

-- 22. Cutoff no configurado se trata como ya pasado, nunca como sin restricción.
update public.app_settings set value = 'null'::jsonb where key = 'availability.cutoff_time';
insert into public.production_dates (product_variant_id, production_date, total_capacity, status) values ('40000000-0000-0000-0000-000000000003', current_date + 41, 10, 'open');
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 41)),
  'cutoff_passed', 'sin cutoff configurado, el motivo es cutoff_passed por seguridad'
);
update public.app_settings set value = '"23:59"'::jsonb where key = 'availability.cutoff_time';

-- 23. Capacidad reservada para suscripciones distingue sold_out de subscription_capacity_only.
insert into public.production_dates (id, product_variant_id, production_date, total_capacity, reserved_for_subscriptions, status)
values ('40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000003', current_date + 50, 5, 5, 'open');
select is(
  (select reason from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 50)),
  'subscription_capacity_only', 'toda la capacidad reservada para suscripciones produce subscription_capacity_only, no sold_out'
);

-- 24. availability_overrides limita la celda variante×punto×fecha por debajo de lo que production_dates permitiría.
insert into public.production_dates (id, product_variant_id, production_date, total_capacity, status)
values ('40000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000003', current_date + 60, 50, 'open');
insert into public.availability_overrides (product_variant_id, pickup_point_id, availability_date, capacity_override, created_by)
values ('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 60, 1, '00000000-0000-0000-0000-000000000401');
select results_eq(
  $$ select status, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 60) $$,
  $$ values ('low_stock'::text, 1::integer) $$,
  'un override de capacidad limita la celda punto×variante aunque la producción permita mucho más'
);

-- 25. set_production_date_status: operator solo puede abrir/cerrar, nunca cancelar.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000404', true);
select is(
  (select ok from public.set_production_date_status('40000000-0000-0000-0000-000000000008', 'closed')),
  true, 'operator puede cerrar una fecha de producción'
);
select is(
  (select reason from public.set_production_date_status('40000000-0000-0000-0000-000000000008', 'cancelled')),
  'operator_status_limited', 'operator no puede cancelar una fecha de producción'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
select is(
  (select ok from public.set_production_date_status('40000000-0000-0000-0000-000000000008', 'cancelled')),
  true, 'owner sí puede cancelar una fecha de producción'
);

-- 26. Nadie tiene concesión de escritura directa sobre stock_reservations/orders: toda mutación pasa por las funciones.
select throws_ok(
  $$ insert into public.stock_reservations (token, session_key, product_variant_id, pickup_point_id, collection_date, quantity, expires_at) values ('x', 'y', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date, 1, now()) $$,
  '42501', null, 'ni siquiera owner tiene INSERT directo sobre stock_reservations'
);
select throws_ok(
  $$ insert into public.orders (public_code, pickup_point_id, collection_date, total_cents) values ('FZ-TEST', '40000000-0000-0000-0000-000000000004', current_date, 100) $$,
  '42501', null, 'ni siquiera owner tiene INSERT directo sobre orders'
);

-- 27. cancel_order exige owner/admin.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000404', true);
select throws_ok(
  $$ select public.cancel_order((select id from public.orders limit 1), 'sin permiso') $$,
  '42501', 'insufficient_privilege', 'operator no puede cancelar pedidos'
);

-- 28. RLS de lectura: customer solo ve sus propias reservas; operator ve todas.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
select is((select count(*)::integer from public.stock_reservations), 0, 'un cliente sin reservas propias no ve las de otros');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000404', true);
select ok((select count(*)::integer from public.stock_reservations) > 0, 'operator ve todas las reservas para producción');

-- 29. Variante con stock_tracking=true: se rige por stock_quantity, no por
--     production_dates (20260808160000_stock_gated_availability.sql). Sin
--     ninguna fila en production_dates para estas variantes, antes del fix
--     habrían quedado 'production_not_open' para siempre sin importar el stock.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);

insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity)
values
  ('40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000002', 'Congelado bajo stock', 800, 10.00, 'active', true, 2),
  ('40000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000002', 'Congelado agotado', 800, 10.00, 'active', true, 0);

select results_eq(
  $$ select status, reason, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  $$ values ('low_stock'::text, 'available'::text, 2) $$,
  'variante con stock_tracking y 2 unidades (umbral 2) es low_stock, sin necesidad de production_dates'
);

select results_eq(
  $$ select status, reason, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  $$ values ('sold_out'::text, 'out_of_stock'::text, null::integer) $$,
  'variante con stock_tracking y 0 unidades es sold_out con motivo out_of_stock, no production_not_open'
);

-- 30. La reserva agota el stock compartido entre fechas: reservar para una
--     fecha de recogida consume el mismo stock_quantity para cualquier otra.
select is(
  (select ok from public.create_stock_reservation('40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', current_date + 10, 2, 'sesion-stock')),
  true, 'reservar las 2 unidades de stock disponibles tiene éxito'
);
select results_eq(
  $$ select status, reason, quantity_available from public.check_variant_availability('40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', current_date + 101) $$,
  $$ values ('sold_out'::text, 'out_of_stock'::text, null::integer) $$,
  'tras reservar las 2 unidades, la variante queda agotada también para otra fecha de recogida: el stock es compartido, no por fecha'
);

-- 31. create_staff_order(): registra pedidos tomados por WhatsApp, teléfono o
--     presencial en el mismo motor de disponibilidad (Documento funcional
--     §5, "sistema de reservas unificado"). Nace 'confirmed' directamente,
--     sin ventana de pago ni Stripe, y descuenta stock_quantity igual que un
--     pedido web pagado.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity)
values ('40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002', 'Congelado pedido manual', 900, 10.00, 'active', true, 5);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000404', true);

select results_eq(
  $$ select ok, reason from public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":1}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 102, 'Cliente Manual', '600111222', null, 'fax', 'paid', null) $$,
  $$ values (false, 'invalid_channel'::text) $$,
  'canal inválido es rechazado'
);
select results_eq(
  $$ select ok, reason from public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":1}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 102, 'Cliente Manual', '600111222', null, 'phone', 'cash', null) $$,
  $$ values (false, 'invalid_payment_status'::text) $$,
  'estado de pago inválido es rechazado'
);
select results_eq(
  $$ select ok, reason from public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":1}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 102, '', '600111222', null, 'phone', 'paid', null) $$,
  $$ values (false, 'invalid_customer'::text) $$,
  'sin nombre de cliente es rechazado'
);

select is(
  (select ok from public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":2}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 102, 'Cliente Manual', '600111222', 'cliente@example.test', 'whatsapp', 'paid', 'Pedido por WhatsApp')),
  true, 'operator puede registrar un pedido manual dentro de su rol de pedidos'
);

select results_eq(
  $$ select status, payment_status, channel from public.orders where customer_phone = '600111222' $$,
  $$ values ('confirmed'::public.order_status, 'paid'::public.payment_status, 'whatsapp'::text) $$,
  'el pedido manual nace confirmed, con el canal y el estado de pago indicados'
);

select is(
  (select count(*)::integer from public.product_stock_movements where order_id = (select id from public.orders where customer_phone = '600111222') and type = 'venta' and quantity = -2),
  1, 'la venta manual descuenta 2 unidades del stock de la variante con seguimiento'
);

select is(
  (select count(*)::integer from public.order_status_history where order_id = (select id from public.orders where customer_phone = '600111222') and new_status = 'confirmed' and source = 'operator'),
  1, 'el historial registra la confirmación con el origen operator'
);

select results_eq(
  $$ select status, reason from public.check_variant_availability('40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000004', current_date + 200) $$,
  $$ values ('available'::text, 'available'::text) $$,
  'tras vender 2 de 5, siguen disponibles 3 unidades para cualquier otra fecha: el pedido manual sí descuenta stock_quantity'
);

select is(
  (select ok from public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":3}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 200, 'Cliente Manual 2', '600111223', null, 'in_person', 'pending', null)),
  true, 'vender las 3 unidades restantes agota exactamente el stock, ni más ni menos'
);
select results_eq(
  $$ select status, reason from public.check_variant_availability('40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000004', current_date + 201) $$,
  $$ values ('sold_out'::text, 'out_of_stock'::text) $$,
  'con las 5 unidades vendidas entre dos pedidos manuales, la variante queda agotada para cualquier fecha'
);

-- 32. Solo owner/admin/operator pueden registrar pedidos manuales.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
select throws_ok(
  $$ select public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":1}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 210, 'Cliente', '600000000', null, 'phone', 'paid', null) $$,
  '42501', null, 'un cliente sin rol de staff no puede registrar pedidos manuales'
);
reset role;
set local role anon;
select throws_ok(
  $$ select public.create_staff_order('[{"variant_id":"40000000-0000-0000-0000-000000000011","quantity":1}]'::jsonb, '40000000-0000-0000-0000-000000000004', current_date + 210, 'Cliente', '600000000', null, 'phone', 'paid', null) $$,
  '42501', null, 'anon no puede registrar pedidos manuales'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);

-- 33. cancel_order() ahora también fija cancelled_at/cancellation_reason y
--     registra el historial (antes solo lo hacía el UPDATE directo del
--     panel /admin/pedidos, que dejaba esas columnas sin tocar).
select is(
  (select ok from public.cancel_order((select id from public.orders where customer_phone = '600111222'), 'Cliente canceló por teléfono')),
  true, 'owner puede cancelar un pedido manual confirmado a través de cancel_order'
);
select ok(
  (select cancelled_at is not null and cancellation_reason = 'Cliente canceló por teléfono' from public.orders where customer_phone = '600111222'),
  'cancel_order fija cancelled_at y cancellation_reason'
);
select is(
  (select count(*)::integer from public.order_status_history where order_id = (select id from public.orders where customer_phone = '600111222') and new_status = 'cancelled'),
  1, 'cancel_order registra la transición en order_status_history'
);
select is(
  (select count(*)::integer from public.product_stock_movements where order_id = (select id from public.orders where customer_phone = '600111222') and type = 'devolucion' and quantity = 2),
  1, 'cancelar un pedido confirmado con stock_tracking restituye las unidades vendidas'
);

-- 34. El público (anon) solo alcanza las funciones de solo lectura, nunca las tablas.
select set_config('request.jwt.claim.sub', '', true);
reset role;
set local role anon;
select lives_ok(
  $$ select * from public.check_variant_availability('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 10) $$,
  'anon puede llamar a la consulta pública de disponibilidad'
);
select throws_ok(
  $$ select count(*) from public.production_dates $$,
  '42501', null, 'anon no tiene acceso directo a production_dates'
);
select throws_ok(
  $$ select count(*) from public.stock_reservations $$,
  '42501', null, 'anon no tiene acceso directo a stock_reservations'
);
select throws_ok(
  $$ select count(*) from public.orders $$,
  '42501', null, 'anon no tiene acceso directo a orders'
);
select throws_ok(
  $$ select public.create_stock_reservation('40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', current_date + 12, 1, 'anon-session') $$,
  '42501', null, 'anon no puede crear reservas: esta fase no expone un flujo público funcional'
);

select * from finish();
rollback;
