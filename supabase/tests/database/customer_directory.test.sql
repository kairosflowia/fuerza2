begin;
select plan(9);

-- ---------------------------------------------------------------------------
-- Preparación: un owner (staff) y dos clientes registrados normales, uno de
-- ellos con un pedido pagado.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-clientes@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000901', 'owner');

-- Alta normal de dos clientes: el trigger on_auth_user_created (auth_foundation.sql)
-- ya inserta profiles(full_name) + user_roles(role='customer') automáticamente
-- al crear la fila en auth.users -- no hay que repetirlo a mano aquí.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente-a@example.test', '', now(), '{}', '{"full_name":"Cliente A"}', now() - interval '2 days', now()),
  ('00000000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente-b@example.test', '', now(), '{}', '{"full_name":"Cliente B"}', now() - interval '1 day', now());
reset role;
update public.profiles set phone = '600100100' where id = '00000000-0000-0000-0000-000000000902';
update public.profiles set phone = '600200200' where id = '00000000-0000-0000-0000-000000000903';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);

insert into public.product_families (id, name, slug, status) values ('90000000-0000-0000-0000-000000000001', 'Familia clientes', 'familia-clientes', 'active');
insert into public.products (id, family_id, name, slug, short_description, status) values ('90000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 'Producto clientes', 'producto-clientes', 'Para pruebas de clientes', 'draft');
insert into public.product_production_weekdays (product_id, weekday, is_active) select '90000000-0000-0000-0000-000000000002', g, true from generate_series(1, 7) g;
insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status, stock_tracking, stock_quantity) values ('90000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000002', 'Única', 500, 4.00, 'active', true, 10);
update public.products set status = 'active' where id = '90000000-0000-0000-0000-000000000002';
insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('90000000-0000-0000-0000-000000000004', 'Punto clientes', 'punto-clientes', 'bakery', 'active', true, true);
insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '90000000-0000-0000-0000-000000000004', g, '10:00', '14:30' from generate_series(1, 7) g;
insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '90000000-0000-0000-0000-000000000004', g, 100 from generate_series(1, 7) g;

select is(
  (select ok from public.create_staff_order('[{"variant_id":"90000000-0000-0000-0000-000000000003","quantity":2}]'::jsonb, '90000000-0000-0000-0000-000000000004', current_date + 10, 'Cliente A', '600100100', 'cliente-a@example.test', 'phone', 'paid', null)),
  true, 'se crea un pedido pagado para el cliente A'
);
reset role;
update public.orders set customer_id = '00000000-0000-0000-0000-000000000902' where customer_phone = '600100100';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);

-- ---------------------------------------------------------------------------
-- admin_customer_directory()
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::integer from public.admin_customer_directory(null) where customer_id in ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000903')),
  2, 'el directorio lista a los dos clientes registrados'
);

select is(
  (select email from public.admin_customer_directory(null) where customer_id = '00000000-0000-0000-0000-000000000902'),
  'cliente-a@example.test', 'expone el email real desde auth.users'
);

select is(
  (select full_name from public.admin_customer_directory(null) where customer_id = '00000000-0000-0000-0000-000000000902'),
  'Cliente A', 'expone el nombre desde profiles'
);

select is(
  (select orders_count from public.admin_customer_directory(null) where customer_id = '00000000-0000-0000-0000-000000000902'),
  1, 'cuenta el pedido pagado del cliente A'
);

select is(
  (select total_spent_cents from public.admin_customer_directory(null) where customer_id = '00000000-0000-0000-0000-000000000902'),
  (select total_cents from public.orders where customer_id = '00000000-0000-0000-0000-000000000902'),
  'suma el gasto total del cliente A'
);

select is(
  (select orders_count from public.admin_customer_directory(null) where customer_id = '00000000-0000-0000-0000-000000000903'),
  0, 'el cliente B sin pedidos aparece con 0 pedidos, no se excluye'
);

select is(
  (select count(*)::integer from public.admin_customer_directory('cliente-a')),
  1, 'el filtro de búsqueda por email funciona'
);

-- ---------------------------------------------------------------------------
-- RLS: ningún cliente puede consultar el directorio de otros clientes.
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000902', true);

select throws_ok(
  $$ select * from public.admin_customer_directory(null) $$,
  '42501', null, 'un cliente no puede consultar el directorio de clientes'
);

reset role;
select * from finish();
rollback;
