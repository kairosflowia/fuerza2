-- Documento funcional del cliente, sección 4: "Sábado = Especial de la
-- semana, rotativo. Debe destacarse y permitir reserva anticipada." A
-- diferencia del resto de "Pan especial del día" (un producto fijo por día
-- de la semana), este slot cambia de producto cada semana por decisión del
-- obrador.
--
-- weekly_specials NO es una entidad de catálogo nueva: apunta a un producto
-- YA existente y activo, reutilizando todo el motor de catálogo/
-- disponibilidad/precio/alérgenos que ya tiene. Es solo una capa de
-- curaduría + destaque: "para el sábado de tal fecha, el especial es este
-- producto". La reserva en sí (y su antelación de 48h) ya la resuelve el
-- motor de disponibilidad existente sin ningún cambio -- lo único que faltaba
-- era el mecanismo de curaduría semanal y el destaque público.

create table public.weekly_specials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  collection_date date not null unique check (extract(isodow from collection_date) = 6),
  headline text check (headline is null or char_length(headline) <= 140),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.weekly_specials is 'Curaduría semanal del "Especial de la semana" (Documento funcional §4): qué producto ya existente se destaca para el sábado indicado. collection_date siempre es sábado (isodow=6, check en la propia columna).';
create index weekly_specials_date_idx on public.weekly_specials(collection_date);

create trigger weekly_specials_updated_at before update on public.weekly_specials for each row execute function app_private.set_updated_at();
create trigger weekly_specials_audit after insert or update or delete on public.weekly_specials for each row execute function app_private.audit_catalog_change();

alter table public.weekly_specials enable row level security;
revoke all on public.weekly_specials from anon, authenticated;

create policy weekly_specials_public_read on public.weekly_specials
for select to anon, authenticated
using (true);

create policy weekly_specials_admin_manage on public.weekly_specials
for all to authenticated
using (app_private.has_role('owner') or app_private.has_role('admin'))
with check (app_private.has_role('owner') or app_private.has_role('admin'));

grant select on public.weekly_specials to anon, authenticated;
grant insert, update, delete on public.weekly_specials to authenticated;
