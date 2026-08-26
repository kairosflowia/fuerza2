-- Newsletter con double opt-in: nadie queda "activo" hasta confirmar por
-- email. customer_consents y notification_preferences exigen customer_id
-- not null (auth_foundation.sql / transactional_communications.sql), así
-- que ninguna de las dos puede representar un subscrito anónimo -- de ahí
-- esta tabla nueva, deliberadamente independiente de clientes con cuenta.
--
-- Los tokens de confirmación/baja siguen el mismo patrón que
-- orders.lookup_token_hash (checkout/create/route.ts): el valor crudo se
-- genera en TypeScript y solo se persiste su hash sha256 -- nunca se guarda
-- ni se puede reconstruir el token en la base de datos.

create type public.newsletter_subscriber_status as enum ('pendiente', 'activo', 'baja', 'bloqueado');

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  customer_id uuid references auth.users(id) on delete set null,
  status public.newsletter_subscriber_status not null default 'pendiente',
  source text not null default 'web',
  consent_version text not null,
  subscribed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_reason text,
  confirm_token_hash text unique,
  confirm_token_expires_at timestamptz,
  unsubscribe_token_hash text unique,
  last_activity_at timestamptz not null default now(),
  blocked_at timestamptz,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_idx on public.newsletter_subscribers (lower(email));
create index newsletter_subscribers_customer_idx on public.newsletter_subscribers (customer_id) where customer_id is not null;
create index newsletter_subscribers_status_idx on public.newsletter_subscribers (status);
create trigger newsletter_subscribers_updated before update on public.newsletter_subscribers for each row execute function app_private.set_updated_at();

-- Histórico de consentimiento: nunca se borra ni se modifica, solo se
-- inserta. Mismo criterio que stock_reservations (fuerza.md: ningún rol
-- tiene grants de escritura directa) -- aquí ni siquiera el service_role
-- puede hacer update/delete, todo pasa por los RPC de abajo.
create table public.newsletter_consent_log (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers(id),
  event_type text not null check (event_type in ('subscribed', 'resent_confirmation', 'confirmed', 'unsubscribed', 'blocked', 'reactivated', 'resubscribed')),
  consent_version text,
  source text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index newsletter_consent_log_subscriber_idx on public.newsletter_consent_log (subscriber_id, created_at desc);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_consent_log enable row level security;
-- Sin policies: todo el acceso pasa por funciones security definer.

revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.newsletter_consent_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Alta pública (double opt-in, paso 1): crea/reinicia el subscrito en estado
-- pendiente y encola el correo de confirmación. p_confirm_url ya viene
-- construido desde TypeScript con el token crudo -- este RPC solo reenvía
-- ese texto al payload del correo, nunca lo persiste.
-- ---------------------------------------------------------------------------
create or replace function public.newsletter_subscribe(
  p_email text,
  p_consent boolean,
  p_consent_version text,
  p_source text,
  p_confirm_token_hash text,
  p_token_expires_at timestamptz,
  p_confirm_url text
)
returns table(ok boolean, reason text, needs_confirmation boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_existing public.newsletter_subscribers;
  v_found_existing boolean;
  v_id uuid;
  v_customer_id uuid;
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return query select false, 'invalid_email', false; return;
  end if;
  if not coalesce(p_consent, false) then
    return query select false, 'consent_required', false; return;
  end if;

  select * into v_existing from public.newsletter_subscribers where lower(email) = v_email;
  v_found_existing := found;

  if v_found_existing and v_existing.status = 'bloqueado' then
    -- No se revela el bloqueo al público: se responde éxito genérico sin tocar nada.
    return query select true, 'blocked', false; return;
  end if;

  if v_found_existing and v_existing.status = 'activo' then
    return query select true, 'already_active', false; return;
  end if;

  if v_found_existing and v_existing.status = 'pendiente' and v_existing.last_activity_at > now() - interval '5 minutes' then
    return query select true, 'already_pending', false; return;
  end if;

  select id into v_customer_id from auth.users where lower(email) = v_email;

  if v_found_existing then
    update public.newsletter_subscribers set
      status = 'pendiente',
      customer_id = coalesce(v_customer_id, customer_id),
      consent_version = p_consent_version,
      source = p_source,
      subscribed_at = now(),
      unsubscribed_at = null,
      unsubscribe_reason = null,
      confirm_token_hash = p_confirm_token_hash,
      confirm_token_expires_at = p_token_expires_at,
      last_activity_at = now()
    where id = v_existing.id
    returning id into v_id;
  else
    insert into public.newsletter_subscribers (email, customer_id, status, source, consent_version, confirm_token_hash, confirm_token_expires_at)
    values (v_email, v_customer_id, 'pendiente', p_source, p_consent_version, p_confirm_token_hash, p_token_expires_at)
    returning id into v_id;
  end if;

  insert into public.newsletter_consent_log (subscriber_id, event_type, consent_version, source)
  values (v_id, case when v_existing.id is null then 'subscribed' else 'resubscribed' end, p_consent_version, p_source);

  perform app_private.enqueue_notification(
    'newsletter-confirm-request', 'newsletter_subscribers', v_id::text,
    v_email, v_customer_id,
    jsonb_build_object('confirm_url', p_confirm_url),
    'newsletter-confirm-request:' || v_id::text || ':' || p_confirm_token_hash,
    'normal'::public.notification_priority
  );

  return query select true, 'pending_confirmation', true;
end;
$$;
revoke all on function public.newsletter_subscribe(text, boolean, text, text, text, timestamptz, text) from public;
grant execute on function public.newsletter_subscribe(text, boolean, text, text, text, timestamptz, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Confirmación (double opt-in, paso 2): solo activa si el token coincide,
-- no ha expirado y sigue pendiente. Genera el token de baja "de arranque"
-- (válido para el correo de bienvenida) y consume el de confirmación.
-- ---------------------------------------------------------------------------
create or replace function public.newsletter_confirm(
  p_token_hash text,
  p_unsubscribe_token_hash text,
  p_unsubscribe_url text
)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber public.newsletter_subscribers;
begin
  select * into v_subscriber
  from public.newsletter_subscribers
  where confirm_token_hash = p_token_hash and status = 'pendiente';

  if not found then
    return query select false, 'invalid_token'; return;
  end if;

  if v_subscriber.confirm_token_expires_at is not null and v_subscriber.confirm_token_expires_at < now() then
    return query select false, 'expired_token'; return;
  end if;

  update public.newsletter_subscribers set
    status = 'activo',
    confirmed_at = now(),
    confirm_token_hash = null,
    confirm_token_expires_at = null,
    unsubscribe_token_hash = p_unsubscribe_token_hash,
    last_activity_at = now()
  where id = v_subscriber.id;

  insert into public.newsletter_consent_log (subscriber_id, event_type, consent_version, source)
  values (v_subscriber.id, 'confirmed', v_subscriber.consent_version, v_subscriber.source);

  perform app_private.enqueue_notification(
    'newsletter-welcome', 'newsletter_subscribers', v_subscriber.id::text,
    v_subscriber.email, v_subscriber.customer_id,
    jsonb_build_object('unsubscribe_url', p_unsubscribe_url),
    'newsletter-welcome:' || v_subscriber.id::text,
    'normal'::public.notification_priority
  );

  return query select true, 'confirmed';
end;
$$;
revoke all on function public.newsletter_confirm(text, text, text) from public;
grant execute on function public.newsletter_confirm(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Baja pública: idempotente (repetir el mismo enlace no duplica histórico).
-- ---------------------------------------------------------------------------
create or replace function public.newsletter_unsubscribe(p_token_hash text, p_reason text default null)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber public.newsletter_subscribers;
begin
  select * into v_subscriber from public.newsletter_subscribers where unsubscribe_token_hash = p_token_hash;
  if not found then
    return query select false, 'invalid_token'; return;
  end if;

  if v_subscriber.status = 'baja' then
    return query select true, 'already_unsubscribed'; return;
  end if;

  update public.newsletter_subscribers set
    status = 'baja',
    unsubscribed_at = now(),
    unsubscribe_reason = nullif(trim(coalesce(p_reason, '')), ''),
    last_activity_at = now()
  where id = v_subscriber.id;

  insert into public.newsletter_consent_log (subscriber_id, event_type, source)
  values (v_subscriber.id, 'unsubscribed', 'self_service');

  return query select true, 'unsubscribed';
end;
$$;
revoke all on function public.newsletter_unsubscribe(text, text) from public;
grant execute on function public.newsletter_unsubscribe(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Administración (staff owner/admin, mismo guard que admin_customer_directory).
-- ---------------------------------------------------------------------------
create or replace function public.admin_newsletter_directory(p_query text default null, p_status text default null)
returns table(
  id uuid,
  email text,
  full_name text,
  customer_id uuid,
  status public.newsletter_subscriber_status,
  source text,
  subscribed_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_activity_at timestamptz,
  can_reactivate boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select
    s.id, s.email, s.full_name, s.customer_id, s.status, s.source,
    s.subscribed_at, s.confirmed_at, s.unsubscribed_at, s.last_activity_at,
    (s.status = 'baja' and s.confirmed_at is not null) as can_reactivate
  from public.newsletter_subscribers s
  where (p_query is null or trim(p_query) = '' or s.email ilike '%' || p_query || '%')
    and (p_status is null or trim(p_status) = '' or s.status::text = p_status)
  order by s.subscribed_at desc;
end;
$$;
revoke all on function public.admin_newsletter_directory(text, text) from public;
grant execute on function public.admin_newsletter_directory(text, text) to authenticated;

create or replace function public.admin_newsletter_resend_confirmation(
  p_subscriber_id uuid,
  p_confirm_token_hash text,
  p_token_expires_at timestamptz,
  p_confirm_url text
)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber public.newsletter_subscribers;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select * into v_subscriber from public.newsletter_subscribers where id = p_subscriber_id;
  if not found or v_subscriber.status <> 'pendiente' then
    return query select false, 'not_pending'; return;
  end if;

  update public.newsletter_subscribers set
    confirm_token_hash = p_confirm_token_hash,
    confirm_token_expires_at = p_token_expires_at,
    last_activity_at = now()
  where id = v_subscriber.id;

  insert into public.newsletter_consent_log (subscriber_id, event_type, actor_id)
  values (v_subscriber.id, 'resent_confirmation', (select auth.uid()));

  perform app_private.enqueue_notification(
    'newsletter-confirm-request', 'newsletter_subscribers', v_subscriber.id::text,
    v_subscriber.email, v_subscriber.customer_id,
    jsonb_build_object('confirm_url', p_confirm_url),
    'newsletter-confirm-request:' || v_subscriber.id::text || ':' || p_confirm_token_hash,
    'normal'::public.notification_priority
  );

  return query select true, 'resent';
end;
$$;
revoke all on function public.admin_newsletter_resend_confirmation(uuid, text, timestamptz, text) from public;
grant execute on function public.admin_newsletter_resend_confirmation(uuid, text, timestamptz, text) to authenticated;

-- p_status en {'baja','bloqueado','activo'}. 'activo' solo permitido desde
-- 'baja' y solo si confirmed_at is not null (reactivar exige que esa
-- persona haya completado alguna vez el double opt-in real -- nunca se
-- puede "suscribir a mano" sin consentimiento válido).
create or replace function public.admin_newsletter_set_status(p_subscriber_id uuid, p_status text, p_reason text default null)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber public.newsletter_subscribers;
  v_event text;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select * into v_subscriber from public.newsletter_subscribers where id = p_subscriber_id;
  if not found then
    return query select false, 'not_found'; return;
  end if;

  if p_status = 'baja' then
    update public.newsletter_subscribers set status = 'baja', unsubscribed_at = now(), unsubscribe_reason = p_reason, last_activity_at = now() where id = v_subscriber.id;
    v_event := 'unsubscribed';
  elsif p_status = 'bloqueado' then
    update public.newsletter_subscribers set status = 'bloqueado', blocked_at = now(), blocked_reason = p_reason, last_activity_at = now() where id = v_subscriber.id;
    v_event := 'blocked';
  elsif p_status = 'activo' then
    if v_subscriber.status <> 'baja' or v_subscriber.confirmed_at is null then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;
    update public.newsletter_subscribers set status = 'activo', unsubscribed_at = null, unsubscribe_reason = null, last_activity_at = now() where id = v_subscriber.id;
    v_event := 'reactivated';
  else
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  insert into public.newsletter_consent_log (subscriber_id, event_type, source, actor_id)
  values (v_subscriber.id, v_event, p_reason, (select auth.uid()));

  return query select true, v_event;
end;
$$;
revoke all on function public.admin_newsletter_set_status(uuid, text, text) from public;
grant execute on function public.admin_newsletter_set_status(uuid, text, text) to authenticated;

create or replace function public.admin_newsletter_consent_history(p_subscriber_id uuid)
returns table(event_type text, consent_version text, source text, actor_name text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select l.event_type, l.consent_version, l.source, coalesce(pr.full_name, 'Sistema'), l.created_at
  from public.newsletter_consent_log l
  left join public.profiles pr on pr.id = l.actor_id
  where l.subscriber_id = p_subscriber_id
  order by l.created_at desc;
end;
$$;
revoke all on function public.admin_newsletter_consent_history(uuid) from public;
grant execute on function public.admin_newsletter_consent_history(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Vínculo retroactivo: si alguien se suscribió antes de tener cuenta, al
-- registrarse se enlaza (sin duplicar) su fila de newsletter_subscribers.
-- ---------------------------------------------------------------------------
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'full_name'), ''));
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');
  update public.newsletter_subscribers set customer_id = new.id
  where lower(email) = lower(new.email) and customer_id is null;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plantillas de correo (mismo patrón que voucher-issued en cancellation_policy.sql).
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, name, subject_template, body_html_template, body_text_template, status, version, required_variables)
values
(
  'newsletter-confirm-request', 'Confirmación de suscripción', 'Confirma tu suscripción a FUERZA',
  '<h1>Ya casi está</h1><p>Confirma que quieres recibir novedades de FUERZA por correo.</p><p><a href="{{confirm_url}}">Confirmar mi suscripción</a></p><p>Este enlace caduca en 48 horas. Si no has sido tú, ignora este correo.</p>',
  'Confirma tu suscripción a FUERZA: {{confirm_url}} (caduca en 48 horas). Si no has sido tú, ignora este correo.',
  'active', 1, array['confirm_url']
),
(
  'newsletter-welcome', 'Bienvenida a la newsletter', '¡Bienvenido/a a FUERZA!',
  '<h1>¡Gracias! Ya formas parte de la lista de FUERZA.</h1><p>Te contaremos lo que sale del horno.</p><p><a href="{{unsubscribe_url}}">Darme de baja</a></p>',
  '¡Gracias! Ya formas parte de la lista de FUERZA. Darte de baja: {{unsubscribe_url}}',
  'active', 1, array['unsubscribe_url']
);
