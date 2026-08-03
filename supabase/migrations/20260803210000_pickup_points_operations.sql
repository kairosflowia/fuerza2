-- Fase 5: obrador principal, puntos externos, horarios, ventanas de recogida,
-- capacidad diaria, excepciones por punto y cierres globales.
-- No implementa disponibilidad por producto, stock, carrito, reservas ni pagos.

-- ---------------------------------------------------------------------------
-- 1. Tipos
-- ---------------------------------------------------------------------------

create type public.pickup_point_type as enum ('bakery', 'external');
create type public.pickup_exception_type as enum ('closed', 'extraordinary_opening', 'schedule_override', 'capacity_override');

-- ---------------------------------------------------------------------------
-- 2. pickup_points: se amplía la tabla mínima creada en la fase 4.
--    La tabla está vacía (0 filas), por lo que la migración del enum de
--    estado es segura sin necesidad de mapear datos existentes.
-- ---------------------------------------------------------------------------

drop policy if exists pickup_points_public_read on public.pickup_points;

alter table public.pickup_points alter column status drop default;
alter table public.pickup_points alter column status type text using status::text;
drop type public.pickup_point_status;
create type public.pickup_point_status as enum ('draft', 'active', 'temporarily_unavailable', 'coming_soon', 'inactive');
alter table public.pickup_points alter column status type public.pickup_point_status using status::public.pickup_point_status;
alter table public.pickup_points alter column status set default 'draft';
alter table public.pickup_points alter column status set not null;

alter table public.pickup_points
  add column type public.pickup_point_type not null default 'external',
  add column is_main_bakery boolean not null default false,
  add column accepts_all_products boolean not null default false,
  add column address_line_1 text,
  add column address_line_2 text,
  add column postal_code text,
  add column city text,
  add column province text,
  add column country_code text not null default 'ES' check (country_code ~ '^[A-Z]{2}$'),
  add column latitude numeric(9, 6) check (latitude is null or (latitude between -90 and 90)),
  add column longitude numeric(9, 6) check (longitude is null or (longitude between -180 and 180)),
  add column public_instructions text,
  add column internal_notes text,
  add column contact_name text,
  add column contact_phone text check (contact_phone is null or char_length(contact_phone) between 5 and 30),
  add column contact_email text check (contact_email is null or contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  add column display_order integer not null default 0 check (display_order >= 0),
  add column is_public boolean not null default false,
  add constraint main_bakery_requires_bakery_type check (not is_main_bakery or type = 'bakery');

comment on column public.pickup_points.accepts_all_products is 'Si es true, el punto acepta todos los productos activos sin necesidad de filas en product_pickup_points. Si es false, solo acepta los productos con is_available=true en esa tabla.';
comment on column public.pickup_points.internal_notes is 'Nunca expuesto en la API pública ni en las vistas públicas.';
comment on column public.pickup_points.is_public is 'Controla si el punto puede aparecer en /donde-estamos, además del estado (active/coming_soon).';

-- A lo sumo un obrador principal.
create unique index pickup_points_single_main_bakery_idx on public.pickup_points (is_main_bakery) where is_main_bakery;

-- ---------------------------------------------------------------------------
-- 3. pickup_point_opening_hours: horario general de apertura. Informativo.
--    No sustituye a la ventana de recogida FUERZA.
-- ---------------------------------------------------------------------------

create table public.pickup_point_opening_hours (
  id uuid primary key default gen_random_uuid(),
  pickup_point_id uuid not null references public.pickup_points(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opening_hours_range check (is_closed or (opens_at is not null and closes_at is not null and opens_at < closes_at)),
  unique (pickup_point_id, weekday)
);
comment on table public.pickup_point_opening_hours is 'Horario general del establecimiento. No condiciona por sí solo el calendario de recogida: ver pickup_point_collection_windows.';
create index pickup_point_opening_hours_point_idx on public.pickup_point_opening_hours(pickup_point_id);

-- ---------------------------------------------------------------------------
-- 4. pickup_point_collection_windows: cuándo se puede recoger pedido FUERZA.
--    Permite más de una ventana por día en el mismo punto.
-- ---------------------------------------------------------------------------

create table public.pickup_point_collection_windows (
  id uuid primary key default gen_random_uuid(),
  pickup_point_id uuid not null references public.pickup_points(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_window_range check (starts_at < ends_at)
);
comment on table public.pickup_point_collection_windows is 'Días y horas en que este punto acepta recogidas de pedidos FUERZA. Distinto del horario general de apertura.';
create index pickup_point_collection_windows_point_day_idx on public.pickup_point_collection_windows(pickup_point_id, weekday) where is_active;

create or replace function app_private.validate_collection_window()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.starts_at >= new.ends_at then
    raise exception 'invalid_window_range' using errcode = '23514';
  end if;

  if new.is_active and exists (
    select 1
    from public.pickup_point_collection_windows w
    where w.pickup_point_id = new.pickup_point_id
      and w.weekday = new.weekday
      and w.is_active
      and w.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (new.starts_at, new.ends_at) overlaps (w.starts_at, w.ends_at)
  ) then
    raise exception 'overlapping_collection_window' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger collection_windows_validate
before insert or update on public.pickup_point_collection_windows
for each row execute function app_private.validate_collection_window();

-- ---------------------------------------------------------------------------
-- 5. pickup_point_capacity_defaults: capacidad logística total del punto por
--    día de la semana. No es capacidad por producto x punto x fecha (fase
--    futura). Ausencia de fila y max_units=0 son estados distintos:
--    ausencia = todavía no configurado (no reservable); 0 = configurado
--    explícitamente como sin capacidad ese día.
-- ---------------------------------------------------------------------------

create table public.pickup_point_capacity_defaults (
  id uuid primary key default gen_random_uuid(),
  pickup_point_id uuid not null references public.pickup_points(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  max_units integer not null check (max_units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pickup_point_id, weekday)
);
comment on table public.pickup_point_capacity_defaults is 'max_units es NOT NULL a propósito: la ausencia de fila para un día significa "todavía no configurado, no reservable"; una fila con max_units=0 significa "configurado explícitamente sin capacidad". No confundir ambos estados en el dominio de disponibilidad de la fase siguiente.';
create index pickup_point_capacity_defaults_point_idx on public.pickup_point_capacity_defaults(pickup_point_id);

-- ---------------------------------------------------------------------------
-- 6. pickup_point_exceptions: excepción para una fecha concreta. Prevalece
--    sobre la configuración semanal (horas y capacidad).
-- ---------------------------------------------------------------------------

create table public.pickup_point_exceptions (
  id uuid primary key default gen_random_uuid(),
  pickup_point_id uuid not null references public.pickup_points(id) on delete cascade,
  exception_date date not null,
  type public.pickup_exception_type not null,
  collection_starts_at time,
  collection_ends_at time,
  capacity_override integer check (capacity_override is null or capacity_override >= 0),
  public_message text,
  internal_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pickup_point_id, exception_date),
  constraint exception_schedule_range check (
    collection_starts_at is null or collection_ends_at is null or collection_starts_at < collection_ends_at
  ),
  constraint exception_type_requires_fields check (
    (type = 'closed')
    or (type = 'extraordinary_opening' and collection_starts_at is not null and collection_ends_at is not null)
    or (type = 'schedule_override' and collection_starts_at is not null and collection_ends_at is not null)
    or (type = 'capacity_override' and capacity_override is not null)
  )
);
comment on table public.pickup_point_exceptions is 'Como mucho una excepción por punto y fecha. Prevalece sobre pickup_point_collection_windows y pickup_point_capacity_defaults para esa fecha. Un cierre global siempre prevalece sobre esta tabla.';
create index pickup_point_exceptions_point_date_idx on public.pickup_point_exceptions(pickup_point_id, exception_date);

-- ---------------------------------------------------------------------------
-- 7. global_closures: cierres que afectan al obrador y a todos los puntos.
--    No se calculan festivos automáticamente.
-- ---------------------------------------------------------------------------

create table public.global_closures (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  public_message text,
  internal_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint global_closure_range check (starts_on <= ends_on)
);
comment on table public.global_closures is 'Cierres manuales (vacaciones, avería, festivo elegido). Vence sobre cualquier configuración o excepción de un punto concreto.';
create index global_closures_range_idx on public.global_closures(starts_on, ends_on);

-- ---------------------------------------------------------------------------
-- 8. pickup_point_contacts: decisión de NO crear esta tabla.
--
--    pickup_points ya incluye contact_name/contact_phone/contact_email como
--    columnas de un único responsable operativo por punto, que es lo que
--    describe el modelo de negocio actual (un responsable por punto; el
--    portal de responsables de punto es explícitamente de fase 2). Crear
--    una tabla separada hoy añadiría una unión, una superficie de RLS y una
--    interfaz de administración adicionales para un caso de exactamente una
--    fila por punto en la práctica: es la abstracción excesiva que las
--    restricciones de esta fase piden evitar. Si en el futuro un punto
--    necesita varios contactos con roles distintos, promover estas tres
--    columnas a una tabla propia es una migración pequeña y de bajo riesgo.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 9. product_pickup_points: se completa la tabla creada en la fase 4.
-- ---------------------------------------------------------------------------

alter table public.product_pickup_points
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create trigger product_pickup_points_updated_at
before update on public.product_pickup_points
for each row execute function app_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. Marcas de tiempo automáticas para las tablas nuevas.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'pickup_point_opening_hours',
    'pickup_point_collection_windows',
    'pickup_point_capacity_defaults',
    'pickup_point_exceptions',
    'global_closures'
  ]
  loop
    execute format('create trigger %I before update on public.%I for each row execute function app_private.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 11. Auditoría. No se registran lecturas, solo escrituras.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'pickup_points',
    'pickup_point_opening_hours',
    'pickup_point_collection_windows',
    'pickup_point_capacity_defaults',
    'pickup_point_exceptions',
    'global_closures',
    'product_pickup_points'
  ]
  loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function app_private.audit_catalog_change()', t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Row Level Security.
-- ---------------------------------------------------------------------------

alter table public.pickup_point_opening_hours enable row level security;
alter table public.pickup_point_collection_windows enable row level security;
alter table public.pickup_point_capacity_defaults enable row level security;
alter table public.pickup_point_exceptions enable row level security;
alter table public.global_closures enable row level security;

-- Personal (owner/admin/operator): lectura de todo lo operativo.
-- Solo owner/admin gestionan (crean, editan, eliminan).
do $$
declare t text;
begin
  foreach t in array array[
    'pickup_point_opening_hours',
    'pickup_point_collection_windows',
    'pickup_point_capacity_defaults',
    'pickup_point_exceptions',
    'global_closures'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (app_private.has_role(''owner'') or app_private.has_role(''admin'') or app_private.has_role(''operator''))',
      t || '_staff_read', t
    );
  end loop;
end $$;

create policy opening_hours_admin_manage on public.pickup_point_opening_hours
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy collection_windows_admin_manage on public.pickup_point_collection_windows
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy capacity_defaults_admin_manage on public.pickup_point_capacity_defaults
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

-- Excepciones y cierres registran quién los creó.
create policy exceptions_admin_insert on public.pickup_point_exceptions
for insert to authenticated
with check ((app_private.has_role('owner') or app_private.has_role('admin')) and created_by = (select auth.uid()));

create policy exceptions_admin_update on public.pickup_point_exceptions
for update to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy exceptions_admin_delete on public.pickup_point_exceptions
for delete to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'));

create policy closures_admin_insert on public.global_closures
for insert to authenticated
with check ((app_private.has_role('owner') or app_private.has_role('admin')) and created_by = (select auth.uid()));

create policy closures_admin_update on public.global_closures
for update to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

create policy closures_admin_delete on public.global_closures
for delete to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'));

-- Concesión de tabla: nunca a anon en estas tablas. El acceso público pasa
-- exclusivamente por las vistas seguras de la sección 13.
grant select, insert, update, delete on public.pickup_point_opening_hours to authenticated;
grant select, insert, update, delete on public.pickup_point_collection_windows to authenticated;
grant select, insert, update, delete on public.pickup_point_capacity_defaults to authenticated;
grant select, insert, update, delete on public.pickup_point_exceptions to authenticated;
grant select, insert, update, delete on public.global_closures to authenticated;

revoke select on public.pickup_points from anon;

-- ---------------------------------------------------------------------------
-- 13. Vistas públicas seguras.
--
--    pickup_points mezcla columnas públicas (nombre, dirección, horario) con
--    columnas internas (contact_*, internal_notes). Depender solo de RLS
--    expondría la fila completa en cuanto la condición de visibilidad se
--    cumpliera. En su lugar: se revoca el acceso directo de anon a las
--    tablas base y se publican vistas que seleccionan explícitamente solo
--    las columnas permitidas, filtradas a puntos públicos y activos o
--    "próximamente".
-- ---------------------------------------------------------------------------

create view public.pickup_points_public
with (security_invoker = false)
as
select
  id, name, slug, type, status, is_main_bakery,
  address_line_1, address_line_2, postal_code, city, province, country_code,
  latitude, longitude, public_instructions, display_order
from public.pickup_points
where is_public and status in ('active', 'coming_soon');

comment on view public.pickup_points_public is 'Única vía de lectura pública de puntos de recogida. Excluye contact_name, contact_phone, contact_email, internal_notes y accepts_all_products.';

create view public.pickup_point_opening_hours_public
with (security_invoker = false)
as
select h.id, h.pickup_point_id, h.weekday, h.opens_at, h.closes_at, h.is_closed
from public.pickup_point_opening_hours h
join public.pickup_points p on p.id = h.pickup_point_id
where p.is_public and p.status in ('active', 'coming_soon');

create view public.pickup_point_collection_windows_public
with (security_invoker = false)
as
select w.id, w.pickup_point_id, w.weekday, w.starts_at, w.ends_at
from public.pickup_point_collection_windows w
join public.pickup_points p on p.id = w.pickup_point_id
where w.is_active and p.is_public and p.status in ('active', 'coming_soon');

create view public.pickup_point_exceptions_public
with (security_invoker = false)
as
select e.id, e.pickup_point_id, e.exception_date, e.type, e.collection_starts_at, e.collection_ends_at, e.public_message
from public.pickup_point_exceptions e
join public.pickup_points p on p.id = e.pickup_point_id
where p.is_public and p.status in ('active', 'coming_soon');

comment on view public.pickup_point_exceptions_public is 'Excluye internal_reason, created_by y capacity_override.';

create view public.global_closures_public
with (security_invoker = false)
as
select id, starts_on, ends_on, public_message
from public.global_closures;

comment on view public.global_closures_public is 'Excluye internal_reason y created_by.';

grant select on public.pickup_points_public to anon, authenticated;
grant select on public.pickup_point_opening_hours_public to anon, authenticated;
grant select on public.pickup_point_collection_windows_public to anon, authenticated;
grant select on public.pickup_point_exceptions_public to anon, authenticated;
grant select on public.global_closures_public to anon, authenticated;
