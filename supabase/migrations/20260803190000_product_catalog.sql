create type public.family_status as enum ('active', 'hidden');
create type public.product_status as enum ('draft', 'active', 'seasonal', 'unavailable', 'discontinued');
create type public.variant_status as enum ('draft', 'active', 'unavailable', 'discontinued');
create type public.allergen_presence as enum ('contains', 'may_contain');
create type public.pickup_point_status as enum ('active', 'hidden');

create table public.product_families (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), description text,
  color_key text not null default 'terracota' check (color_key in ('terracota','amarillo','verde','azul','negro')),
  display_order integer not null default 0 check (display_order >= 0), status public.family_status not null default 'hidden',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.product_families(id),
  name text not null check (char_length(name) between 1 and 140), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text, long_description text, flour_type text, flour_origin text,
  fermentation_hours integer check (fermentation_hours is null or fermentation_hours > 0),
  status public.product_status not null default 'draft', display_order integer not null default 0 check (display_order >= 0),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70), seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_family_status_idx on public.products(family_id,status,display_order);
create table public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100), approximate_weight_grams integer check (approximate_weight_grams is null or approximate_weight_grams > 0),
  price_cents integer check (price_cents is null or price_cents >= 0), vat_rate numeric(5,2) not null check (vat_rate >= 0 and vat_rate <= 100),
  status public.variant_status not null default 'draft', display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint active_variant_has_price check (status <> 'active' or price_cents is not null), unique(product_id,name)
);
create index product_variants_product_idx on public.product_variants(product_id,status,display_order);
create table public.ingredients (id uuid primary key default gen_random_uuid(), name text not null unique check (char_length(name) between 1 and 100), created_at timestamptz not null default now());
create table public.product_ingredients (product_id uuid references public.products(id) on delete cascade, ingredient_id uuid references public.ingredients(id), display_order integer not null default 0 check(display_order>=0), notes text, primary key(product_id,ingredient_id));
create table public.allergens (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null unique, display_order integer not null check(display_order>=0));
create table public.product_allergens (product_id uuid references public.products(id) on delete cascade, allergen_id uuid references public.allergens(id), presence_type public.allergen_presence not null, notes text, primary key(product_id,allergen_id,presence_type));
create table public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpe?g|png|webp|avif)$'),
  alt_text text, display_order integer not null default 0 check(display_order>=0), is_primary boolean not null default false, created_at timestamptz not null default now()
);
create unique index product_images_one_primary_idx on public.product_images(product_id) where is_primary;
create table public.product_production_weekdays (product_id uuid references public.products(id) on delete cascade, weekday smallint check(weekday between 1 and 7), is_active boolean not null default true, primary key(product_id,weekday));
create table public.pickup_points (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), status public.pickup_point_status not null default 'hidden', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_pickup_points (product_id uuid references public.products(id) on delete cascade, pickup_point_id uuid references public.pickup_points(id) on delete cascade, is_available boolean not null default false, primary key(product_id,pickup_point_id));

create or replace function app_private.validate_product_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('active','seasonal') then
    if nullif(trim(new.name),'') is null or nullif(trim(new.slug),'') is null or nullif(trim(new.short_description),'') is null or new.family_id is null then raise exception 'incomplete_product' using errcode='23514'; end if;
    if not exists(select 1 from public.product_variants where product_id=new.id and status='active' and price_cents is not null) then raise exception 'active_variant_required' using errcode='23514'; end if;
    if exists(select 1 from public.product_images where product_id=new.id and nullif(trim(alt_text),'') is null) then raise exception 'published_images_require_alt_text' using errcode='23514'; end if;
  end if; return new;
end $$;
create trigger products_validate_publication before insert or update on public.products for each row execute function app_private.validate_product_publication();

do $$ declare t text; begin foreach t in array array['product_families','products','product_variants','pickup_points'] loop execute format('create trigger %I before update on public.%I for each row execute function app_private.set_updated_at()',t||'_updated_at',t); end loop; end $$;
create or replace function app_private.audit_catalog_change() returns trigger language plpgsql security definer set search_path='' as $$
declare old_json jsonb; new_json jsonb; action_name text;
begin old_json=case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end; new_json=case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
action_name='catalog.'||tg_table_name||'.'||lower(tg_op);
insert into public.audit_logs(actor_id,action,entity_type,entity_id,previous_data,new_data) values((select auth.uid()),action_name,tg_table_name,coalesce(new_json->>'id',old_json->>'id',new_json->>'product_id',old_json->>'product_id'),old_json,new_json); return coalesce(new,old); end $$;
do $$ declare t text; begin foreach t in array array['product_families','products','product_variants','product_allergens','product_images'] loop execute format('create trigger %I after insert or update or delete on public.%I for each row execute function app_private.audit_catalog_change()',t||'_audit',t); end loop; end $$;

insert into public.allergens(code,name,display_order) values
('gluten','Cereales que contienen gluten',1),('crustaceans','Crustáceos',2),('eggs','Huevos',3),('fish','Pescado',4),('peanuts','Cacahuetes',5),('soybeans','Soja',6),('milk','Leche',7),('nuts','Frutos de cáscara',8),('celery','Apio',9),('mustard','Mostaza',10),('sesame','Granos de sésamo',11),('sulphites','Dióxido de azufre y sulfitos',12),('lupin','Altramuces',13),('molluscs','Moluscos',14);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',false,8388608,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$ declare t text; begin foreach t in array array['product_families','products','product_variants','ingredients','product_ingredients','allergens','product_allergens','product_images','product_production_weekdays','pickup_points','product_pickup_points'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); end loop; end $$;

create policy families_public_read on public.product_families for select to anon,authenticated using(status='active');
create policy products_public_read on public.products for select to anon,authenticated using(status in ('active','seasonal') and exists(select 1 from public.product_families f where f.id=family_id and f.status='active'));
create policy variants_public_read on public.product_variants for select to anon,authenticated using(status='active' and exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));
create policy ingredients_public_read on public.ingredients for select to anon,authenticated using(exists(select 1 from public.product_ingredients pi join public.products p on p.id=pi.product_id where pi.ingredient_id=id and p.status in('active','seasonal')));
create policy product_ingredients_public_read on public.product_ingredients for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));
create policy allergens_public_read on public.allergens for select to anon,authenticated using(exists(select 1 from public.product_allergens pa join public.products p on p.id=pa.product_id where pa.allergen_id=id and p.status in('active','seasonal')));
create policy product_allergens_public_read on public.product_allergens for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));
create policy product_images_public_read on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));
create policy weekdays_public_read on public.product_production_weekdays for select to anon,authenticated using(is_active and exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));
create policy pickup_points_public_read on public.pickup_points for select to anon,authenticated using(status='active');
create policy product_pickup_public_read on public.product_pickup_points for select to anon,authenticated using(is_available and exists(select 1 from public.products p where p.id=product_id and p.status in('active','seasonal')));

do $$ declare t text; begin foreach t in array array['product_families','products','product_variants','ingredients','product_ingredients','allergens','product_allergens','product_images','product_production_weekdays','pickup_points','product_pickup_points'] loop
execute format('create policy %I on public.%I for select to authenticated using(app_private.has_role(''owner'') or app_private.has_role(''admin'') or app_private.has_role(''operator''))',t||'_staff_read',t);
execute format('create policy %I on public.%I for all to authenticated using(app_private.has_role(''owner'') or app_private.has_role(''admin'')) with check(app_private.has_role(''owner'') or app_private.has_role(''admin''))',t||'_admin_manage',t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['product_families','products','product_variants','ingredients','product_ingredients','allergens','product_allergens','product_images','product_production_weekdays','pickup_points','product_pickup_points'] loop execute format('grant select on public.%I to anon,authenticated',t); execute format('grant insert,update,delete on public.%I to authenticated',t); end loop; end $$;

create policy product_storage_public_read on storage.objects for select to anon,authenticated using(bucket_id='product-images' and name ~ '^[0-9a-f-]{36}/' and exists(select 1 from public.products p where p.id=((storage.foldername(name))[1])::uuid and p.status in('active','seasonal')));
create policy product_storage_admin_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and (app_private.has_role('owner') or app_private.has_role('admin')) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpe?g|png|webp|avif)$' and (storage.foldername(name))[1]::uuid in(select id from public.products));
create policy product_storage_admin_update on storage.objects for update to authenticated using(bucket_id='product-images' and (app_private.has_role('owner') or app_private.has_role('admin'))) with check(bucket_id='product-images' and (app_private.has_role('owner') or app_private.has_role('admin')));
create policy product_storage_admin_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and (app_private.has_role('owner') or app_private.has_role('admin')));
