begin;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-special@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000601', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);

insert into public.product_families (id, name, slug, status) values ('60000000-0000-0000-0000-000000000001', 'Familia especial', 'familia-especial', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('60000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'Producto especial', 'producto-especial', 'Para pruebas', 'draft');
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status) values ('60000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', 'Única', 500, 4.00, 'active');
update public.products set status = 'active' where id = '60000000-0000-0000-0000-000000000002';

select has_table('public', 'weekly_specials', 'la tabla de especial de la semana existe');
select ok((select relrowsecurity from pg_class where oid = 'public.weekly_specials'::regclass), 'weekly_specials tiene RLS habilitada');

select throws_ok(
  $$ insert into public.weekly_specials (product_id, collection_date) values ('60000000-0000-0000-0000-000000000002', (select min(d) from generate_series(current_date, current_date + 6, interval '1 day') d where extract(isodow from d) <> 6)) $$,
  '23514', null, 'la fecha del especial debe caer en sábado'
);

select lives_ok(
  $$ insert into public.weekly_specials (product_id, collection_date, headline) values ('60000000-0000-0000-0000-000000000002', (select min(d)::date from generate_series(current_date, current_date + 6, interval '1 day') d where extract(isodow from d) = 6), 'Pan de la casa') $$,
  'owner puede curar el especial de un sábado válido'
);

select throws_ok(
  $$ insert into public.weekly_specials (product_id, collection_date) values ('60000000-0000-0000-0000-000000000002', (select min(d)::date from generate_series(current_date, current_date + 6, interval '1 day') d where extract(isodow from d) = 6)) $$,
  '23505', null, 'no puede haber dos especiales para el mismo sábado'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000602', true);
select throws_ok(
  $$ insert into public.weekly_specials (product_id, collection_date) values ('60000000-0000-0000-0000-000000000002', (select min(d)::date from generate_series(current_date + 7, current_date + 13, interval '1 day') d where extract(isodow from d) = 6)) $$,
  '42501', null, 'un cliente sin rol de staff no puede curar el especial'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);

reset role;
set local role anon;
select is(
  (select count(*)::integer from public.weekly_specials),
  1, 'anon puede leer los especiales publicados'
);
select throws_ok(
  $$ insert into public.weekly_specials (product_id, collection_date) values ('60000000-0000-0000-0000-000000000002', current_date) $$,
  '42501', null, 'anon no puede curar el especial'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'weekly_specials' and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE', 'DELETE')),
  0, 'anon no tiene ninguna concesión de escritura sobre weekly_specials'
);

-- ---------------------------------------------------------------------------
-- Prioridad de Fuerza Habitual (Documento funcional §7): quien tiene una
-- suscripción activa puede reservar el Especial de la semana antes que el
-- público general.
-- ---------------------------------------------------------------------------

reset role;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-special-sin-habitual@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-special-con-habitual@example.test', '', now(), '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);

insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity)
values ('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', 'Congelado prioridad', 900, 10.00, 'active', true, 20);
insert into public.product_production_weekdays (product_id, weekday, is_active) values ('60000000-0000-0000-0000-000000000002', 6, true);

insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('60000000-0000-0000-0000-000000000005', 'Punto especial', 'punto-especial', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) values ('60000000-0000-0000-0000-000000000005', 6, '10:00', '14:30');
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) values ('60000000-0000-0000-0000-000000000005', 6, 100);

insert into public.app_settings (key, value, is_public, updated_by)
values
  ('availability.cutoff_time', '"10:00:00"'::jsonb, true, '00000000-0000-0000-0000-000000000601'),
  ('availability.cutoff_days_before', '2'::jsonb, true, '00000000-0000-0000-0000-000000000601'),
  ('availability.subscriber_priority_hours', '48'::jsonb, true, '00000000-0000-0000-0000-000000000601')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = excluded.updated_by;

-- Un sábado a más de 8 días vista: pasa el corte normal de 48h para
-- cualquiera, pero sigue dentro de la ventana exclusiva de Fuerza Habitual
-- (corte menos 48h de prioridad = todavía faltan más de 48h para que se
-- abra al público).
insert into public.weekly_specials (product_id, collection_date, headline)
values (
  '60000000-0000-0000-0000-000000000002',
  (select min(d)::date from generate_series(current_date + 8, current_date + 20, interval '1 day') d where extract(isodow from d) = 6),
  'Especial con prioridad'
);
select set_config('test.special_date', (select collection_date::text from public.weekly_specials where product_id = '60000000-0000-0000-0000-000000000002' and headline = 'Especial con prioridad'), true);

-- Otro sábado más lejano todavía, SIN especial curado: sirve para probar que
-- la restricción de prioridad no afecta a fechas normales de esta misma
-- variante.
select set_config(
  'test.plain_date',
  (select min(d)::date::text from generate_series(current_date + 22, current_date + 34, interval '1 day') d where extract(isodow from d) = 6),
  true
);

-- reset role solo cambia el rol de Postgres: la reclamación
-- request.jwt.claim.sub del bloque anterior (owner) sigue viva hasta que se
-- limpia explícitamente, así que auth.uid() seguiría devolviendo ese id
-- aunque el rol ya sea anon.
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select results_eq(
  $$ select status, reason from public.check_variant_availability('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', current_setting('test.special_date')::date) $$,
  $$ values ('sold_out'::text, 'reserved_for_subscribers'::text) $$,
  'anon no puede reservar el especial de la semana antes de que se abra al público'
);
select results_eq(
  $$ select status, reason from public.check_variant_availability('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', current_setting('test.plain_date')::date) $$,
  $$ values ('available'::text, 'available'::text) $$,
  'la misma variante en un sábado normal (sin especial curado) sí está disponible para anon'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000603', true);
select results_eq(
  $$ select status, reason from public.check_variant_availability('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', current_setting('test.special_date')::date) $$,
  $$ values ('sold_out'::text, 'reserved_for_subscribers'::text) $$,
  'un cliente autenticado sin Fuerza Habitual activa tampoco puede reservarlo todavía'
);

reset role;
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '60000000-0000-0000-0000-000000000005', g, '10:00', '14:30' from generate_series(1, 5) g on conflict do nothing;
insert into public.subscriptions (id, customer_id, pickup_point_id, preferred_weekday, frequency, status, subtotal_cents, discount_percent, total_cents)
values ('60000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000604', '60000000-0000-0000-0000-000000000005', 3, 'weekly', 'active', 900, 0, 900);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000604', true);
select results_eq(
  $$ select status, reason from public.check_variant_availability('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', current_setting('test.special_date')::date) $$,
  $$ values ('available'::text, 'available'::text) $$,
  'un cliente con Fuerza Habitual activa sí puede reservar el especial con prioridad'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select results_eq(
  $$ select status, reason from public.check_variant_availability('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', current_setting('test.special_date')::date) $$,
  $$ values ('available'::text, 'available'::text) $$,
  'el personal del obrador (owner/admin/operator) también puede reservarlo, sin esperar a la ventana pública'
);

select * from finish();
rollback;
