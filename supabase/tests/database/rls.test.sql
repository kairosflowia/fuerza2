begin;
select plan(9);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-0000-0000-000000000103', 'owner'),
  ('00000000-0000-0000-0000-000000000104', 'admin');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*)::integer from public.profiles), 1, 'customer sees only own profile');
select is((select count(*)::integer from public.user_roles), 1, 'customer sees only own customer role');
select is_empty(
  $$ update public.profiles set full_name = 'Intruso'
     where id = '00000000-0000-0000-0000-000000000102'
     returning id $$,
  'customer cannot update another profile'
);
select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000101', 'admin') $$,
  '42501', null, 'customer cannot assign roles directly'
);
select lives_ok(
  $$ insert into public.customer_consents (customer_id, consent_type, granted, source, version) values ('00000000-0000-0000-0000-000000000101', 'privacy', true, 'account', '1') $$,
  'customer records own consent'
);
select throws_ok(
  $$ update public.customer_consents set granted = false where customer_id = '00000000-0000-0000-0000-000000000101' $$,
  '42501', null, 'consent history is immutable'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select throws_ok(
  $$ select public.assign_user_role('00000000-0000-0000-0000-000000000102', 'owner') $$,
  '42501', 'insufficient_privilege', 'admin cannot create owner'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select lives_ok(
  $$ select public.assign_user_role('00000000-0000-0000-0000-000000000102', 'operator') $$,
  'owner can assign operational role'
);
select ok(
  exists(select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-000000000102' and role = 'operator'),
  'assigned role is visible to owner'
);

select * from finish();
rollback;
