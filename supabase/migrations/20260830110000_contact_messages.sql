-- Formulario de contacto público (Fase 16): hasta ahora el formulario estaba
-- completamente desactivado y no existía ninguna tabla para registrar
-- mensajes. Igual que newsletter_subscribers, la tabla vive detrás de RLS sin
-- policies -- todo el acceso pasa por RPC security definer.

create type public.contact_message_reason as enum ('general', 'recogida', 'colaboracion');
create type public.contact_message_status as enum ('nuevo', 'atendido', 'descartado');

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  reason public.contact_message_reason not null,
  message text not null,
  consent_version text not null,
  status public.contact_message_status not null default 'nuevo',
  internal_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create trigger contact_messages_updated before update on public.contact_messages for each row execute function app_private.set_updated_at();

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Alta pública: sin doble opt-in (es una consulta puntual, no una lista de
-- correo). El rate limit real vive en TypeScript (enforceRateLimit, mismo
-- patrón que auth.login) antes de invocar este RPC.
-- ---------------------------------------------------------------------------
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_phone text,
  p_reason text,
  p_message text,
  p_consent boolean,
  p_consent_version text
)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_name text := trim(p_name);
  v_message text := trim(p_message);
begin
  if v_name = '' or char_length(v_name) > 200 then
    return query select false, 'invalid_name'; return;
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(v_email) > 254 then
    return query select false, 'invalid_email'; return;
  end if;
  if v_message = '' or char_length(v_message) > 4000 then
    return query select false, 'invalid_message'; return;
  end if;
  if not coalesce(p_consent, false) then
    return query select false, 'consent_required'; return;
  end if;
  if p_reason not in ('general', 'recogida', 'colaboracion') then
    return query select false, 'invalid_reason'; return;
  end if;

  insert into public.contact_messages (name, email, phone, reason, message, consent_version)
  values (v_name, v_email, nullif(trim(coalesce(p_phone, '')), ''), p_reason::public.contact_message_reason, v_message, p_consent_version);

  return query select true, 'received';
end;
$$;
revoke all on function public.submit_contact_message(text, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text, boolean, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Administración (owner/admin, mismo guard que admin_customer_directory).
-- ---------------------------------------------------------------------------
create or replace function public.admin_contact_messages(p_status text default null)
returns table(
  id uuid, name text, email text, phone text, reason public.contact_message_reason,
  message text, status public.contact_message_status, internal_note text,
  resolved_at timestamptz, created_at timestamptz
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
  select m.id, m.name, m.email, m.phone, m.reason, m.message, m.status, m.internal_note, m.resolved_at, m.created_at
  from public.contact_messages m
  where p_status is null or trim(p_status) = '' or m.status::text = p_status
  order by (m.status = 'nuevo') desc, m.created_at desc;
end;
$$;
revoke all on function public.admin_contact_messages(text) from public;
grant execute on function public.admin_contact_messages(text) to authenticated;

create or replace function public.admin_set_contact_message_status(p_id uuid, p_status text, p_note text default null)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin')) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if p_status not in ('nuevo', 'atendido', 'descartado') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update public.contact_messages set
    status = p_status::public.contact_message_status,
    internal_note = coalesce(nullif(trim(coalesce(p_note, '')), ''), internal_note),
    resolved_at = case when p_status in ('atendido', 'descartado') then now() else null end,
    resolved_by = case when p_status in ('atendido', 'descartado') then auth.uid() else null end
  where id = p_id;

  if not found then
    return query select false, 'not_found'; return;
  end if;
  return query select true, p_status;
end;
$$;
revoke all on function public.admin_set_contact_message_status(uuid, text, text) from public;
grant execute on function public.admin_set_contact_message_status(uuid, text, text) to authenticated;
