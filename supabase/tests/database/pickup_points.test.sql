begin;
select plan(23);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-pickup@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-pickup@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operator-pickup@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-0000-0000-000000000301', 'owner'),
  ('00000000-0000-0000-0000-000000000303', 'operator');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);

-- 1. owner creates the main bakery
insert into public.pickup_points (id, name, slug, type, is_main_bakery, is_public, status)
values ('10000000-0000-0000-0000-000000000101', 'Obrador FUERZA', 'obrador-fuerza', 'bakery', true, true, 'active');
select ok(exists(select 1 from public.pickup_points where slug = 'obrador-fuerza'), 'owner creates the main bakery');

-- 2. only one main bakery allowed
select throws_ok(
  $$ insert into public.pickup_points (name, slug, type, is_main_bakery, status)
     values ('Segundo obrador', 'segundo-obrador', 'bakery', true, 'draft') $$,
  '23505', null, 'a second main bakery is rejected'
);

-- 3. main bakery flag requires bakery type
select throws_ok(
  $$ insert into public.pickup_points (name, slug, type, is_main_bakery, status)
     values ('Punto externo principal', 'punto-externo-principal', 'external', true, 'draft') $$,
  '23514', null, 'is_main_bakery requires type=bakery'
);

-- 4. unique slug
select throws_ok(
  $$ insert into public.pickup_points (name, slug, type, status) values ('Duplicado', 'obrador-fuerza', 'external', 'draft') $$,
  '23505', null, 'duplicate slug is rejected'
);

-- second, non-main, external point for the rest of the tests
insert into public.pickup_points (id, name, slug, type, is_public, status)
values ('10000000-0000-0000-0000-000000000102', 'Panadería Amiga', 'panaderia-amiga', 'external', true, 'coming_soon');

-- 5. valid opening hours
insert into public.pickup_point_opening_hours (pickup_point_id, weekday, opens_at, closes_at)
values ('10000000-0000-0000-0000-000000000101', 1, '09:00', '18:00');
select ok(exists(select 1 from public.pickup_point_opening_hours where pickup_point_id = '10000000-0000-0000-0000-000000000101' and weekday = 1), 'valid opening hours stored');

-- 6. invalid opening hours range rejected
select throws_ok(
  $$ insert into public.pickup_point_opening_hours (pickup_point_id, weekday, opens_at, closes_at)
     values ('10000000-0000-0000-0000-000000000101', 2, '18:00', '09:00') $$,
  '23514', null, 'opening hours require opens_at before closes_at'
);

-- 7. two non-overlapping collection windows on the same weekday are allowed
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at)
values ('10000000-0000-0000-0000-000000000101', 1, '09:30', '11:00');
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at)
values ('10000000-0000-0000-0000-000000000101', 1, '16:00', '17:30');
select is((select count(*)::integer from public.pickup_point_collection_windows where pickup_point_id = '10000000-0000-0000-0000-000000000101'), 2, 'two non-overlapping windows are allowed');

-- 8. overlapping window on the same weekday is rejected
select throws_ok(
  $$ insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at)
     values ('10000000-0000-0000-0000-000000000101', 1, '10:00', '12:00') $$,
  '23514', 'overlapping_collection_window', 'overlapping collection windows are rejected'
);

-- 9. capacity cannot be negative
select throws_ok(
  $$ insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) values ('10000000-0000-0000-0000-000000000101', 1, -1) $$,
  '23514', null, 'negative capacity is rejected'
);

-- 10. zero capacity is a valid, explicit configuration
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) values ('10000000-0000-0000-0000-000000000102', 3, 0);
select is((select max_units from public.pickup_point_capacity_defaults where pickup_point_id = '10000000-0000-0000-0000-000000000102' and weekday = 3), 0, 'zero capacity is stored as an explicit closed day, not as absence');

-- 11. global closure
insert into public.global_closures (starts_on, ends_on, public_message, created_by) values (current_date, current_date + 1, 'Cierre de prueba', '00000000-0000-0000-0000-000000000301');
select ok(exists(select 1 from public.global_closures where public_message = 'Cierre de prueba'), 'owner creates a global closure');

-- 12. a specific exception for a point and date
insert into public.pickup_point_exceptions (pickup_point_id, exception_date, type, public_message, created_by)
values ('10000000-0000-0000-0000-000000000101', current_date + 5, 'closed', 'Cerrado por mantenimiento', '00000000-0000-0000-0000-000000000301');
select ok(exists(select 1 from public.pickup_point_exceptions where pickup_point_id = '10000000-0000-0000-0000-000000000101' and exception_date = current_date + 5), 'owner creates a specific exception');

-- 13. only one exception per point and date
select throws_ok(
  $$ insert into public.pickup_point_exceptions (pickup_point_id, exception_date, type, created_by)
     values ('10000000-0000-0000-0000-000000000101', current_date + 5, 'closed', '00000000-0000-0000-0000-000000000301') $$,
  '23505', null, 'a second exception for the same point and date is rejected'
);

-- 14. public view shows only public, active/coming_soon points
select is((select count(*)::integer from public.pickup_points_public), 2, 'public view shows the active bakery and the coming_soon point');

-- 15. a draft point never appears in the public view
insert into public.pickup_points (name, slug, type, is_public, status) values ('Borrador', 'borrador-punto', 'external', true, 'draft');
select is((select count(*)::integer from public.pickup_points_public where slug = 'borrador-punto'), 0, 'a draft point does not appear in the public view even if is_public=true');

-- 16. internal columns are not selectable from the public view
select is(
  (select count(*)::integer from information_schema.columns where table_schema = 'public' and table_name = 'pickup_points_public' and column_name in ('contact_name', 'contact_phone', 'contact_email', 'internal_notes', 'accepts_all_products')),
  0,
  'the public view exposes none of the internal columns'
);

-- product accepted at a point, exercised end to end
insert into public.product_families (id, name, slug, status) values ('20000000-0000-0000-0000-000000000301', 'Familia recogida', 'familia-recogida', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('20000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000301', 'Pan de recogida', 'pan-de-recogida', 'Para pruebas de recogida', 'draft');
insert into public.product_variants (product_id, name, price_cents, vat_rate, status) values ('20000000-0000-0000-0000-000000000302', 'Única', 350, 4.00, 'active');
update public.products set status = 'active' where id = '20000000-0000-0000-0000-000000000302';
insert into public.product_pickup_points (product_id, pickup_point_id, is_available) values ('20000000-0000-0000-0000-000000000302', '10000000-0000-0000-0000-000000000101', true);

-- 17. operator can read operational configuration
select is((select count(*)::integer from public.pickup_point_collection_windows), 2, 'operator query prepared: two windows exist before role switch');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000303', true);
select is((select count(*)::integer from public.pickup_points), 3, 'operator can read all pickup points');

-- 18. operator cannot alter structural configuration (write has no effect)
update public.pickup_points set contact_name = 'Intento de operador' where id = '10000000-0000-0000-0000-000000000101';
select is((select contact_name from public.pickup_points where id = '10000000-0000-0000-0000-000000000101'), null, 'operator write to pickup_points has no effect');

-- 19. customer cannot write to any operational table
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', true);
select throws_ok(
  $$ insert into public.pickup_points (name, slug, type, status) values ('Cliente', 'cliente-punto', 'external', 'draft') $$,
  '42501', null, 'customer cannot create pickup points'
);

-- 20. anon only sees the public view, never the base table
reset role;
set local role anon;
select is((select count(*)::integer from public.pickup_points_public), 2, 'anon reads only public points through the view');
select throws_ok($$ select count(*) from public.pickup_points $$, '42501', null, 'anon has no direct access to the base table');

-- 21. writes and exceptions are audited
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);
select ok(exists(select 1 from public.audit_logs where entity_type = 'pickup_points'), 'pickup point changes are audited');

select * from finish();
rollback;
