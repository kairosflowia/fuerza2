create type public.app_role as enum ('customer', 'owner', 'admin', 'operator', 'pickup_manager');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 5 and 30),
  locale text not null default 'es-ES' check (locale in ('es-ES')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles(role);

create table public.customer_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (char_length(consent_type) between 1 and 80),
  granted boolean not null,
  source text not null check (char_length(source) between 1 and 80),
  version text not null check (char_length(version) between 1 and 40),
  created_at timestamptz not null default now()
);

create index customer_consents_customer_created_idx on public.customer_consents(customer_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 120),
  entity_id text,
  previous_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create table public.app_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.-]{1,79}$'),
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint app_settings_no_secret_keys check (key !~* '(secret|password|token|private|service.?role|api.?key)')
);

comment on table public.app_settings is 'Configuración no secreta. Nunca almacenar credenciales, tokens ni claves.';
comment on table public.audit_logs is 'Registro inmutable de acciones relevantes; no registrar tokens, contraseñas ni secretos.';

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create or replace function app_private.has_role(requested_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = requested_role
  );
$$;

create or replace function app_private.has_any_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('owner', 'admin', 'operator', 'pickup_manager')
  );
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.has_role(public.app_role) to authenticated;
grant execute on function app_private.has_any_admin_role() to authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function app_private.set_updated_at();

create or replace function app_private.audit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data, new_data)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then to_jsonb(old)->>'id' else coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key') end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger profiles_audit_update
after update on public.profiles
for each row execute function app_private.audit_change();

create trigger app_settings_audit_change
after insert or update or delete on public.app_settings
for each row execute function app_private.audit_change();

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
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

create or replace function public.assign_user_role(target_user_id uuid, target_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_role('owner') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  insert into public.user_roles (user_id, role, granted_by)
  values (target_user_id, target_role, (select auth.uid()))
  on conflict (user_id, role) do nothing;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  values ((select auth.uid()), 'role.assigned', 'user_role', target_user_id::text, jsonb_build_object('role', target_role));
end;
$$;

create or replace function public.remove_user_role(target_user_id uuid, target_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_role('owner') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if target_role = 'owner' and (
    select count(*) from public.user_roles where role = 'owner'
  ) <= 1 then
    raise exception 'cannot_remove_last_owner' using errcode = '23514';
  end if;
  delete from public.user_roles where user_id = target_user_id and role = target_role;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_data)
  values ((select auth.uid()), 'role.removed', 'user_role', target_user_id::text, jsonb_build_object('role', target_role));
end;
$$;

create or replace function public.log_admin_event(event_action text, event_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if event_action not in ('admin.login', 'admin.access_denied') then
    raise exception 'invalid_audit_action' using errcode = '22023';
  end if;
  if event_action = 'admin.login' and not app_private.has_any_admin_role() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, metadata)
  values ((select auth.uid()), event_action, 'admin_session', coalesce(event_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.assign_user_role(uuid, public.app_role) from public, anon;
revoke all on function public.remove_user_role(uuid, public.app_role) from public, anon;
revoke all on function public.log_admin_event(text, jsonb) from public, anon;
grant execute on function public.assign_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.remove_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.log_admin_event(text, jsonb) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customer_consents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using ((select auth.uid()) = id or app_private.has_role('owner') or app_private.has_role('admin'));

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy user_roles_select_own_or_owner on public.user_roles
for select to authenticated
using ((select auth.uid()) = user_id or app_private.has_role('owner'));

create policy consents_select_own_or_admin on public.customer_consents
for select to authenticated
using ((select auth.uid()) = customer_id or app_private.has_role('owner') or app_private.has_role('admin'));

create policy consents_insert_own on public.customer_consents
for insert to authenticated
with check ((select auth.uid()) = customer_id);

create policy audit_logs_select_admin on public.audit_logs
for select to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'));

create policy settings_select_public on public.app_settings
for select to anon, authenticated
using (is_public or app_private.has_role('owner') or app_private.has_role('admin'));

create policy settings_insert_admin on public.app_settings
for insert to authenticated
with check (
  (app_private.has_role('owner') or app_private.has_role('admin'))
  and updated_by = (select auth.uid())
);

create policy settings_update_admin on public.app_settings
for update to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (
  (app_private.has_role('owner') or app_private.has_role('admin'))
  and updated_by = (select auth.uid())
);

revoke all on public.profiles, public.user_roles, public.customer_consents, public.audit_logs, public.app_settings from anon, authenticated;
grant select, update (full_name, phone, locale) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert on public.customer_consents to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.app_settings to anon, authenticated;
grant insert (key, value, description, is_public, updated_by), update (value, description, is_public, updated_by) on public.app_settings to authenticated;

insert into public.app_settings (key, value, description, is_public)
values ('operational.timezone', '"Europe/Madrid"'::jsonb, 'Zona horaria operativa del obrador.', true);
