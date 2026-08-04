-- Atributos de obrador (tipo de harina/base y dieta) para filtrar el catálogo público.
-- A diferencia de los alérgenos, son etiquetas fijas controladas por la aplicación: no
-- necesitan una tabla de referencia editable, solo una lista cerrada validada con check().

create table public.product_attributes (
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_code text not null check (attribute_code in (
    'masa_madre','harina_integral','harina_centeno','harina_espelta','harina_piedra','multicereales',
    'vegano','sin_lactosa','sin_azucar','fermentacion_lenta'
  )),
  primary key (product_id, attribute_code)
);

alter table public.product_attributes enable row level security;
revoke all on public.product_attributes from anon, authenticated;

create policy product_attributes_public_read on public.product_attributes for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status in ('active','seasonal')));
create policy product_attributes_staff_read on public.product_attributes for select to authenticated
  using (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
create policy product_attributes_admin_manage on public.product_attributes for all to authenticated
  using (app_private.has_role('owner') or app_private.has_role('admin'))
  with check (app_private.has_role('owner') or app_private.has_role('admin'));

grant select on public.product_attributes to anon, authenticated;
grant insert, update, delete on public.product_attributes to authenticated;
