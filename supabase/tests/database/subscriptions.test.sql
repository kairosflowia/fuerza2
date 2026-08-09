begin;
select plan(53);

-- ---------------------------------------------------------------------------
-- Estructura.
-- ---------------------------------------------------------------------------

select has_table('public', 'subscriptions', 'subscriptions table exists');
select has_table('public', 'subscription_items', 'basket items table exists');
select has_table('public', 'subscription_cycles', 'cycles table exists');
select has_table('public', 'subscription_status_history', 'immutable status history exists');
select has_table('public', 'subscription_change_requests', 'controlled changes exist');
select has_column('public', 'product_variants', 'subscribable', 'variants can be curated for Fuerza Habitual');
select col_is_unique('public', 'subscription_cycles', 'stripe_invoice_id', 'one cycle per Stripe invoice');
select col_is_unique('public', 'subscriptions', 'stripe_subscription_id', 'Stripe subscription cannot duplicate');
select col_is_unique('public', 'orders', 'subscription_cycle_id', 'one order per cycle');
select ok((select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass), 'subscriptions use RLS');
select hasnt_table('public', 'subscription_plans', 'fixed plans no longer exist: baskets are built by the customer');
select has_function('public', 'create_subscription_basket', array['jsonb', 'uuid', 'integer', 'public.subscription_frequency', 'uuid'], 'basket creation function exists');
select has_function('public', 'generate_subscription_cycles', array[]::text[], 'recurring cycle generator exists');
select has_function('public', 'request_subscription_pause', array['uuid', 'date'], 'pause function exists');
select has_function('public', 'request_subscription_resume', array['uuid'], 'resume function exists');
select has_function('public', 'request_subscription_cancellation', array['uuid', 'text'], 'cancellation function exists');
select has_function('public', 'process_subscription_invoice', array['text', 'text', 'text', 'text', 'integer', 'text', 'text'], 'idempotent invoice processor exists');
select has_function('public', 'run_subscription_jobs', array[]::text[], 'subscription reconciliation job exists');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok($$ select * from public.process_subscription_invoice('evt','in','sub','pi',100,'eur','hash') $$, '42501', null, 'clients cannot process invoices');
select throws_ok($$ select public.run_subscription_jobs() $$, '42501', null, 'clients cannot execute reconciliation jobs');
select throws_ok($$ select public.generate_subscription_cycles() $$, '42501', null, 'clients cannot generate cycles');
reset role;

-- ---------------------------------------------------------------------------
-- Preparación: dos variantes suscribibles (con seguimiento de estoque para
-- no depender de production_dates por fecha), punto de recogida abierto
-- todos los días, y un corte PERMISIVO (0 días) mientras se ejercita la
-- creación de la cesta -- la política real de 48h se activa más abajo, justo
-- para las pruebas de pausa/cancelación.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-habitual@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-habitual-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-habitual-b@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000701', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

insert into public.product_families (id, name, slug, status) values ('70000000-0000-0000-0000-000000000001', 'Familia habitual', 'familia-habitual', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('70000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Producto habitual A', 'producto-habitual-a', 'Para pruebas', 'draft');
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity, subscribable)
values ('70000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'Única', 500, 4.00, 'active', true, 50, true);
update public.products set status = 'active' where id = '70000000-0000-0000-0000-000000000002';
insert into public.product_production_weekdays (product_id, weekday, is_active) select '70000000-0000-0000-0000-000000000002', g, true from generate_series(1, 7) g;

insert into public.products (id, family_id, name, slug, short_description, status) values ('70000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', 'Producto habitual B', 'producto-habitual-b', 'Para pruebas', 'draft');
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity, subscribable)
values ('70000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000004', 'Única', 700, 10.00, 'active', true, 50, true);
update public.products set status = 'active' where id = '70000000-0000-0000-0000-000000000004';
insert into public.product_production_weekdays (product_id, weekday, is_active) select '70000000-0000-0000-0000-000000000004', g, true from generate_series(1, 7) g;

insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity, subscribable)
values ('70000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', 'No suscribible', 400, 4.00, 'active', true, 50, false);

insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('70000000-0000-0000-0000-000000000007', 'Punto habitual', 'punto-habitual', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '70000000-0000-0000-0000-000000000007', g, '09:00', '18:00' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '70000000-0000-0000-0000-000000000007', g, 100 from generate_series(1, 7) g;

insert into public.app_settings (key, value, is_public, updated_by)
values
  ('availability.cutoff_time', '"23:59:59"'::jsonb, true, '00000000-0000-0000-0000-000000000701'),
  ('availability.cutoff_days_before', '0'::jsonb, true, '00000000-0000-0000-0000-000000000701'),
  ('subscriptions.cycle_generation_days_ahead', '35'::jsonb, false, '00000000-0000-0000-0000-000000000701')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = excluded.updated_by;

-- ---------------------------------------------------------------------------
-- create_subscription_basket(): la cesta la arma el cliente.
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000702', true);

select results_eq(
  $$ select ok, reason from public.create_subscription_basket('[]'::jsonb, '70000000-0000-0000-0000-000000000007', 3, 'weekly') $$,
  $$ values (false, 'invalid_basket'::text) $$,
  'una cesta vacía es rechazada'
);
select results_eq(
  $$ select ok, reason from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '70000000-0000-0000-0000-000000000007', 9, 'weekly') $$,
  $$ values (false, 'invalid_weekday'::text) $$,
  'un día de la semana fuera de 1-7 es rechazado'
);
select results_eq(
  $$ select ok, reason from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000006","quantity":1}]'::jsonb, '70000000-0000-0000-0000-000000000007', 3, 'weekly') $$,
  $$ values (false, 'variant_not_subscribable'::text) $$,
  'una variante no marcada como subscribable es rechazada'
);

select results_eq(
  $$ select ok, discount_percent from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000003","quantity":2},{"variant_id":"70000000-0000-0000-0000-000000000005","quantity":2}]'::jsonb, '70000000-0000-0000-0000-000000000007', 3, 'weekly') $$,
  $$ values (true, 5::numeric) $$,
  'una cesta con 4 unidades en total obtiene el 5% de descuento'
);
select is(
  (select subtotal_cents from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid),
  2400, 'el subtotal es la suma de precio × cantidad de cada artículo (2×500 + 2×700)'
);
select is(
  (select total_cents from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid),
  round(2400 * 0.95)::integer, 'el total refleja el 5% de descuento sobre el subtotal'
);
select is(
  (select count(*)::integer from public.subscription_items where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid)),
  2, 'se crean dos artículos en la cesta, uno por variante'
);
select is(
  (select count(*)::integer from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid)),
  1, 'se crea el primer ciclo, con capacidad reservada'
);
-- subscription_capacity_allocations es de solo lectura para staff (misma
-- política que production_dates/availability_overrides): se consulta como
-- owner, no como el cliente dueño de la suscripción.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select is(
  (select count(*)::integer from public.subscription_capacity_allocations where source_reference = (select id::text from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid)),
  2, 'se reserva capacidad para cada artículo de la cesta'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000703', true);
select results_eq(
  $$ select ok, discount_percent from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '70000000-0000-0000-0000-000000000007', 4, 'weekly') $$,
  $$ values (true, 0::numeric) $$,
  'una cesta con menos de 4 unidades no obtiene descuento'
);

-- ---------------------------------------------------------------------------
-- generate_subscription_cycles(): sin esto, ninguna suscripción real
-- produciría más que una entrega.
-- ---------------------------------------------------------------------------

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select is(
  (select (public.generate_subscription_cycles() ->> 'created')::integer),
  0, 'una suscripción todavía incomplete (sin primer pago) no genera un segundo ciclo'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

-- Simula que el primer ciclo ya se pagó (equivalente a lo que haría el
-- webhook invoice.paid vía process_subscription_invoice). subscriptions/
-- subscription_cycles no tienen concesión de escritura directa ni para
-- owner (mismo patrón "solo por función SECURITY DEFINER" que orders):
-- hace falta reset role para esta simulación de test.
reset role;
update public.subscriptions set status = 'active' where customer_id = '00000000-0000-0000-0000-000000000702'::uuid;
update public.subscription_cycles set status = 'order_created' where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid);

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select is(
  (select (public.generate_subscription_cycles() ->> 'created')::integer),
  1, 'con el primer ciclo ya resuelto, se genera el siguiente ciclo semanal'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

select is(
  (select count(*)::integer from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid)),
  2, 'ahora existen dos ciclos para esa suscripción'
);
select is(
  (
    select (max(collection_date) - min(collection_date))
    from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid)
  ),
  7, 'el segundo ciclo semanal cae exactamente 7 días después del primero'
);
select is(
  (select count(*)::integer from public.subscription_capacity_allocations where subscription_cycle_id = (select id from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid) order by collection_date desc limit 1)),
  2, 'el segundo ciclo también reserva capacidad para los dos artículos'
);

-- Frecuencia "cada 3 semanas": se crea, simula y verifica el salto de 21 días.
reset role;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-habitual-c@example.test', '', now(), '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000704', true);
select is(
  (select ok from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '70000000-0000-0000-0000-000000000007', 2, 'every_3_weeks')),
  true, 'se puede crear una cesta con frecuencia cada 3 semanas'
);
reset role;
update public.subscriptions set status = 'active' where customer_id = '00000000-0000-0000-0000-000000000704'::uuid;
update public.subscription_cycles set status = 'order_created' where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid);
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select public.generate_subscription_cycles();
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select is(
  (
    select (max(collection_date) - min(collection_date))
    from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid)
  ),
  21, 'con frecuencia cada 3 semanas, el siguiente ciclo cae 21 días después'
);

-- ---------------------------------------------------------------------------
-- Pausa/cancelación con la política real de 48h. Se activa el corte
-- realista (2 días, 10:00) solo para esta parte, y se fija collection_date
-- directamente para no depender de qué día de la semana sea "hoy" al
-- ejecutar la batería.
-- ---------------------------------------------------------------------------

insert into public.app_settings (key, value, is_public, updated_by)
values
  ('availability.cutoff_time', '"10:00:00"'::jsonb, true, '00000000-0000-0000-0000-000000000701'),
  ('availability.cutoff_days_before', '2'::jsonb, true, '00000000-0000-0000-0000-000000000701')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = excluded.updated_by;

-- La suscripción de customer-habitual-a tiene su ciclo más próximo (el
-- segundo, todavía capacity_reserved) a 7 días vista: se fuerza a 10 días
-- para que quede claramente a 48h o más.
reset role;
update public.subscription_cycles set collection_date = current_date + 10
  where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid) and status = 'capacity_reserved';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- La RLS de subscriptions solo deja ver la propia fila: se resuelve el id
-- como owner (que sí puede leer cualquier suscripción) antes de intentar
-- la pausa como el cliente equivocado -- si no, la subconsulta ya
-- devolvería NULL por RLS y la función respondería 'not_found' en vez de
-- lanzar la excepción de permiso que se quiere probar.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select set_config('test.sub_a_id', (select id::text from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid), true);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000703', true);
select throws_ok(
  $$ select public.request_subscription_pause(current_setting('test.sub_a_id')::uuid, null) $$,
  '42501', null, 'un cliente no puede pausar la suscripción de otro'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000702', true);
select results_eq(
  $$ select ok, effective from public.request_subscription_pause((select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid), null) $$,
  $$ values (true, 'immediate'::text) $$,
  'pausar con 48h o más de antelación sobre el próximo ciclo libera ese ciclo de inmediato'
);
select is(
  (select status from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid),
  'paused'::public.subscription_status, 'la suscripción queda paused'
);
select is(
  (select count(*)::integer from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid) and status = 'skipped'),
  1, 'el ciclo próximo (a 10 días vista) se marca skipped al pausar'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select is(
  (select count(*)::integer from public.subscription_capacity_allocations where subscription_cycle_id in (select id from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid) and status = 'skipped')),
  0, 'la capacidad reservada de ese ciclo se libera'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000702', true);
select is(
  (select ok from public.request_subscription_resume((select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid))),
  true, 'el propio cliente puede retomar su suscripción pausada'
);
select is(
  (select status from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000702'::uuid),
  'active'::public.subscription_status, 'retomar deja la suscripción active de nuevo'
);

-- customer-habitual-c (every_3_weeks): su ciclo pendiente se fuerza a HOY,
-- claramente a menos de 48h.
reset role;
update public.subscription_cycles set collection_date = current_date
  where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid) and status = 'capacity_reserved';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000704', true);
select results_eq(
  $$ select ok, effective from public.request_subscription_cancellation((select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid), 'ya no lo quiero') $$,
  $$ values (true, 'next_cycle'::text) $$,
  'cancelar con menos de 48h para el próximo ciclo no lo cancela: ya está comprometido en producción'
);
select is(
  (select status from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid),
  'cancel_pending'::public.subscription_status, 'la suscripción queda cancel_pending, no cancelled, mientras el ciclo comprometido sigue su curso'
);
select is(
  (select count(*)::integer from public.subscription_cycles where subscription_id = (select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid) and status = 'capacity_reserved'),
  1, 'el ciclo a menos de 48h NO se libera: sigue reservado'
);
select is(
  (select cancel_at_period_end from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid),
  true, 'cancel_at_period_end queda marcado para que Stripe deje de facturar tras el ciclo en curso'
);
select results_eq(
  $$ select ok, reason from public.request_subscription_cancellation((select id from public.subscriptions where customer_id = '00000000-0000-0000-0000-000000000704'::uuid), null) $$,
  $$ values (false, 'already_cancelled'::text) $$,
  'pedir la cancelación dos veces la segunda vez no hace nada nuevo'
);

-- ---------------------------------------------------------------------------
-- process_subscription_invoice(): Stripe es la autoridad financiera -- ya no
-- rechaza por una diferencia de importe (antes comparaba contra un
-- subscription_plans.price_cents fijo que ya no existe). Se prueba también
-- la idempotencia por evento.
-- ---------------------------------------------------------------------------

-- Suscripción nueva y sin tocar (customer-habitual-a ya se pausó/reanudó
-- arriba y se quedó sin ciclo pendiente que consumir).
reset role;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-habitual-d@example.test', '', now(), '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000705', true);
select is(
  (select ok from public.create_subscription_basket('[{"variant_id":"70000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb, '70000000-0000-0000-0000-000000000007', 5, 'weekly')),
  true, 'se crea una suscripción nueva y limpia para probar process_subscription_invoice'
);
reset role;
update public.subscriptions set stripe_subscription_id = 'sub_test_habitual' where customer_id = '00000000-0000-0000-0000-000000000705'::uuid;

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select results_eq(
  $$ select ok, reason from public.process_subscription_invoice('evt_habitual_1','in_1','sub_test_habitual','pi_1',999,'eur','hash1') $$,
  $$ values (true, 'order_created'::text) $$,
  'process_subscription_invoice acepta el importe que Stripe ya cobró, sin comprobarlo contra un precio fijo'
);
select results_eq(
  $$ select ok, reason from public.process_subscription_invoice('evt_habitual_1','in_1','sub_test_habitual','pi_1',999,'eur','hash1') $$,
  $$ values (true, 'already_processed'::text) $$,
  'reprocesar el mismo evento de Stripe es idempotente'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

select * from finish();
rollback;
