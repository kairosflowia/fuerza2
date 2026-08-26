-- /admin/clientes vivía como un placeholder vacío (AdminEmptyState genérico
-- del catch-all [section]/page.tsx): nunca se consultó auth.users/profiles,
-- así que ningún cliente registrado aparecía nunca. El trigger de
-- auth_foundation.sql inserta una fila user_roles(role='customer') para
-- cada alta nueva -- esa es la fuente de verdad de "quién se ha registrado".

create or replace function public.admin_customer_directory(p_query text default null)
returns table(
  customer_id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  orders_count integer,
  total_spent_cents integer,
  last_order_at timestamptz
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
    u.id,
    u.email::text,
    p.full_name,
    p.phone,
    u.created_at,
    coalesce(o.orders_count, 0)::integer,
    coalesce(o.total_spent_cents, 0)::integer,
    o.last_order_at
  from auth.users u
  join public.user_roles ur on ur.user_id = u.id and ur.role = 'customer'
  left join public.profiles p on p.id = u.id
  left join lateral (
    select count(*)::integer as orders_count, sum(ord.total_cents)::integer as total_spent_cents, max(ord.created_at) as last_order_at
    from public.orders ord
    where ord.customer_id = u.id and ord.payment_status = 'paid'
  ) o on true
  where p_query is null or trim(p_query) = ''
    or u.email ilike '%' || p_query || '%'
    or p.full_name ilike '%' || p_query || '%'
    or p.phone ilike '%' || p_query || '%'
  order by u.created_at desc;
end;
$$;
revoke all on function public.admin_customer_directory(text) from public;
grant execute on function public.admin_customer_directory(text) to authenticated;
