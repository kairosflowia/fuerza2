begin;
select plan(33);

-- ---------------------------------------------------------------------------
-- Preparación: un owner (staff) para las acciones administrativas.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('95000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-newsletter@example.test', '', now(), '{}', '{}', now(), now());
insert into public.user_roles (user_id, role) values ('95000000-0000-0000-0000-000000000001', 'owner');

select has_table('public', 'newsletter_subscribers', 'la tabla de subscritos existe');
select has_table('public', 'newsletter_consent_log', 'la tabla de histórico de consentimiento existe');
select ok((select relrowsecurity from pg_class where oid = 'public.newsletter_subscribers'::regclass), 'newsletter_subscribers tiene RLS habilitada');

-- ---------------------------------------------------------------------------
-- Alta pública: validaciones y flujo feliz (rol anon, como el formulario público).
-- Las lecturas de verificación se hacen siempre con reset role (superusuario
-- de pgTAP), porque newsletter_subscribers no tiene ningún grant directo
-- para anon/authenticated -- todo el acceso pasa por los RPC de abajo.
-- ---------------------------------------------------------------------------

set local role anon;
select is(
  (select ok from public.newsletter_subscribe('no-es-un-email', true, '2026-08', 'web', 'hash-invalido', now() + interval '48 hours', 'https://fuerza.test/confirmar')),
  false, 'rechaza un email con formato inválido'
);

select is(
  (select ok from public.newsletter_subscribe('lector@example.test', false, '2026-08', 'web', 'hash-sin-consentimiento', now() + interval '48 hours', 'https://fuerza.test/confirmar')),
  false, 'rechaza el alta sin consentimiento explícito'
);

select is(
  (select needs_confirmation from public.newsletter_subscribe('lector@example.test', true, '2026-08', 'web', 'hash-alta-1', now() + interval '48 hours', 'https://fuerza.test/confirmar?token=t1')),
  true, 'el alta válida queda pendiente de confirmación'
);

select is(
  (select ok from public.newsletter_subscribe('lector@example.test', true, '2026-08', 'web', 'hash-alta-2', now() + interval '48 hours', 'https://fuerza.test/confirmar?token=t2')) is not null,
  true, 'reintentar el alta dentro del cooldown responde igualmente ok'
);

reset role;

select is(
  (select status::text from public.newsletter_subscribers where email = 'lector@example.test'),
  'pendiente', 'el subscrito nuevo queda en estado pendiente'
);

select is(
  (select count(*)::integer from public.notification_events where event_key = 'newsletter-confirm-request' and recipient_email = 'lector@example.test'),
  1, 'se encola un único correo de confirmación (el reintento en cooldown no duplica)'
);

select is(
  (select confirm_token_hash from public.newsletter_subscribers where email = 'lector@example.test'),
  'hash-alta-1', 'el token de confirmación no cambia mientras dure el cooldown de 5 minutos'
);

-- ---------------------------------------------------------------------------
-- Confirmación: token equivocado, token correcto, y reutilización del enlace.
-- ---------------------------------------------------------------------------

set local role anon;

select is(
  (select ok from public.newsletter_confirm('token-equivocado', 'hash-baja-1', 'https://fuerza.test/baja?token=b1')),
  false, 'un token de confirmación equivocado se rechaza'
);

select is(
  (select ok from public.newsletter_confirm('hash-alta-1', 'hash-baja-1', 'https://fuerza.test/baja?token=b1')),
  true, 'el token correcto confirma la suscripción'
);

select is(
  (select ok from public.newsletter_confirm('hash-alta-1', 'hash-baja-2', 'https://fuerza.test/baja?token=b2')),
  false, 'el enlace de confirmación ya usado no se puede reutilizar'
);

reset role;

select is(
  (select status::text from public.newsletter_subscribers where email = 'lector@example.test'),
  'activo', 'tras confirmar, el estado pasa a activo'
);

select isnt(
  (select confirmed_at from public.newsletter_subscribers where email = 'lector@example.test'),
  null, 'se registra la fecha de confirmación'
);

select is(
  (select count(*)::integer from public.notification_events where event_key = 'newsletter-welcome' and recipient_email = 'lector@example.test'),
  1, 'se encola el correo de bienvenida al confirmar'
);

-- ---------------------------------------------------------------------------
-- Baja: idempotente, y nunca borra el histórico.
-- ---------------------------------------------------------------------------

set local role anon;

select is(
  (select ok from public.newsletter_unsubscribe('hash-baja-equivocado')),
  false, 'un token de baja equivocado se rechaza'
);

select is(
  (select ok from public.newsletter_unsubscribe('hash-baja-1')),
  true, 'la baja con el token correcto funciona'
);

select is(
  (select reason from public.newsletter_unsubscribe('hash-baja-1')),
  'already_unsubscribed', 'repetir la baja es idempotente, no duplica el histórico'
);

reset role;

select is(
  (select status::text from public.newsletter_subscribers where email = 'lector@example.test'),
  'baja', 'tras darse de baja, el estado es baja'
);

select is(
  (select count(*)::integer from public.newsletter_consent_log l join public.newsletter_subscribers s on s.id = l.subscriber_id where s.email = 'lector@example.test' and l.event_type = 'unsubscribed'),
  1, 'la baja repetida no añade una segunda entrada al histórico'
);

-- ---------------------------------------------------------------------------
-- Reactivación administrativa: solo permitida si hubo confirmación real.
-- ---------------------------------------------------------------------------

reset role;
select set_config('test.lector_id', (select id::text from public.newsletter_subscribers where email = 'lector@example.test'), true);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);

select is(
  (select ok from public.admin_newsletter_set_status(current_setting('test.lector_id')::uuid, 'activo', null)),
  true, 'un admin puede reactivar a alguien que sí completó el double opt-in'
);

reset role;
select is(
  (select status::text from public.newsletter_subscribers where email = 'lector@example.test'),
  'activo', 'la reactivación deja al subscrito en estado activo'
);

set local role anon;
select ok from public.newsletter_subscribe('nunca-confirmo@example.test', true, '2026-08', 'web', 'hash-nunca', now() + interval '48 hours', 'https://fuerza.test/confirmar?token=n1');

reset role;
select set_config('test.nunca_confirmo_id', (select id::text from public.newsletter_subscribers where email = 'nunca-confirmo@example.test'), true);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$ select public.admin_newsletter_set_status(current_setting('test.nunca_confirmo_id')::uuid, 'activo', null) $$,
  '22023', 'invalid_transition', 'no se puede activar manualmente a quien nunca confirmó el opt-in'
);

-- ---------------------------------------------------------------------------
-- Bloqueo: una vez bloqueado, volver a "suscribirse" no reactiva nada.
-- ---------------------------------------------------------------------------

select ok from public.admin_newsletter_set_status(current_setting('test.nunca_confirmo_id')::uuid, 'bloqueado', 'spam');

set local role anon;
select is(
  (select ok from public.newsletter_subscribe('nunca-confirmo@example.test', true, '2026-08', 'web', 'hash-post-bloqueo', now() + interval '48 hours', 'https://fuerza.test/confirmar')),
  true, 'volver a enviar el formulario para un email bloqueado responde éxito genérico'
);

reset role;
select is(
  (select status::text from public.newsletter_subscribers where email = 'nunca-confirmo@example.test'),
  'bloqueado', 'pero el estado real sigue siendo bloqueado, no se reactiva'
);

-- ---------------------------------------------------------------------------
-- Vínculo con clientes con cuenta, en ambos sentidos.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('95000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'con-cuenta@example.test', '', now(), '{}', '{}', now(), now());

set local role anon;
select ok from public.newsletter_subscribe('con-cuenta@example.test', true, '2026-08', 'web', 'hash-con-cuenta', now() + interval '48 hours', 'https://fuerza.test/confirmar');
select ok from public.newsletter_confirm('hash-con-cuenta', 'hash-baja-cuenta', 'https://fuerza.test/baja?token=cuenta');
select ok from public.newsletter_subscribe('futuro-cliente@example.test', true, '2026-08', 'web', 'hash-futuro', now() + interval '48 hours', 'https://fuerza.test/confirmar');

reset role;
select is(
  (select customer_id from public.newsletter_subscribers where email = 'con-cuenta@example.test'),
  '95000000-0000-0000-0000-000000000002'::uuid, 'si el email ya tiene cuenta, se enlaza customer_id al suscribirse'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('95000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'futuro-cliente@example.test', '', now(), '{}', '{}', now(), now());

select is(
  (select customer_id from public.newsletter_subscribers where email = 'futuro-cliente@example.test'),
  '95000000-0000-0000-0000-000000000003'::uuid, 'si se suscribe antes de tener cuenta, crear la cuenta enlaza retroactivamente'
);

-- ---------------------------------------------------------------------------
-- Directorio de administración y permisos.
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*)::integer from public.admin_newsletter_directory(null, 'activo') where email in ('lector@example.test', 'con-cuenta@example.test')),
  2, 'el directorio filtra por estado activo'
);

select is(
  (select count(*)::integer from public.admin_newsletter_directory('nunca-confirmo', null)),
  1, 'el directorio filtra por búsqueda de email'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$ select * from public.admin_newsletter_directory(null, null) $$,
  '42501', null, 'un cliente sin rol de staff no puede consultar el directorio de suscritos'
);
select throws_ok(
  $$ select public.admin_newsletter_set_status('95000000-0000-0000-0000-000000000001'::uuid, 'baja', null) $$,
  '42501', null, 'un cliente sin rol de staff no puede cambiar el estado de un suscrito'
);

-- ---------------------------------------------------------------------------
-- El histórico de consentimiento nunca se puede borrar, ni siquiera un owner.
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$ delete from public.newsletter_consent_log $$,
  '42501', null, 'ni siquiera un owner tiene DELETE directo sobre newsletter_consent_log'
);

select * from finish();
rollback;
