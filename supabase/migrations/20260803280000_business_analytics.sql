-- Fase 12: analítica própria, agregada e sem dados pessoais.
create index if not exists orders_analytics_created_idx on public.orders(created_at, payment_status, order_type);
create index if not exists orders_analytics_collection_idx on public.orders(collection_date, pickup_point_id, status);
create index if not exists order_items_analytics_product_idx on public.order_items(product_id, product_variant_id, order_id);
create index if not exists incidents_analytics_idx on public.production_incidents(production_date, status, severity, type);

create or replace function public.get_business_analytics(
  p_start date,
  p_end date,
  p_pickup_point_id uuid default null,
  p_product_id uuid default null,
  p_origin text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; commercial boolean;
begin
  if not (app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')) then
    raise exception 'insufficient_privilege' using errcode='42501';
  end if;
  if p_start is null or p_end is null or p_end < p_start or p_end - p_start > 366 then
    raise exception 'invalid_analytics_period' using errcode='22023';
  end if;
  if p_origin is not null and p_origin not in ('one_off','subscription') then
    raise exception 'invalid_analytics_origin' using errcode='22023';
  end if;
  commercial := app_private.has_role('owner') or app_private.has_role('admin');

  with filtered_orders as (
    select o.* from public.orders o
    where (o.created_at at time zone 'Europe/Madrid')::date between p_start and p_end
      and (p_pickup_point_id is null or o.pickup_point_id=p_pickup_point_id)
      and (p_origin is null or o.order_type=p_origin)
      and (p_product_id is null or exists(select 1 from public.order_items x where x.order_id=o.id and x.product_id=p_product_id))
  ), valid_orders as (
    select * from filtered_orders where payment_status in ('paid','refunded','partially_refunded')
  ), item_metrics as (
    select oi.product_id,oi.product_variant_id,oi.product_name_snapshot,oi.variant_name_snapshot,
      sum(oi.quantity)::integer units,sum(oi.line_total_cents)::bigint revenue_cents,
      sum(oi.quantity) filter(where o.order_type='one_off')::integer one_off_units,
      sum(oi.quantity) filter(where o.order_type='subscription')::integer subscription_units
    from public.order_items oi join valid_orders o on o.id=oi.order_id
    group by oi.product_id,oi.product_variant_id,oi.product_name_snapshot,oi.variant_name_snapshot
  ), point_metrics as (
    select o.pickup_point_id,coalesce(pp.name,'Sin punto') point_name,count(distinct o.id)::integer orders,
      coalesce(sum(oi.quantity),0)::integer units,coalesce(sum(oi.line_total_cents),0)::bigint revenue_cents
    from valid_orders o left join public.pickup_points pp on pp.id=o.pickup_point_id left join public.order_items oi on oi.order_id=o.id
    group by o.pickup_point_id,pp.name
  ), daily_sales as (
    select (created_at at time zone 'Europe/Madrid')::date sale_date,sum(total_cents)::bigint revenue_cents,count(*)::integer order_count
    from valid_orders group by 1 order by 1
  ), status_counts as (
    select status::text key,count(*)::integer value from filtered_orders group by status
  ), incident_counts as (
    select type::text type,severity::text severity,count(*)::integer total
    from public.production_incidents
    where production_date between p_start and p_end and (p_pickup_point_id is null or pickup_point_id=p_pickup_point_id)
    group by type,severity
  ), production as (
    select coalesce(sum(planned_quantity),0)::integer planned,coalesce(sum(produced_quantity),0)::integer produced,
      coalesce(sum(packed_quantity),0)::integer packed,
      coalesce(sum(greatest(produced_quantity-planned_quantity,0)),0)::integer surplus
    from public.production_batches where production_date between p_start and p_end
      and (p_product_id is null or product_variant_id in(select id from public.product_variants where product_id=p_product_id))
  )
  select jsonb_build_object(
    'period',jsonb_build_object('start',p_start,'end',p_end),
    'financial',case when commercial then jsonb_build_object(
      'gross_cents',coalesce((select sum(total_cents) from filtered_orders where payment_status in('paid','refunded','partially_refunded')),0),
      'paid_cents',coalesce((select sum(total_cents) from filtered_orders where payment_status='paid'),0),
      'today_paid_cents',coalesce((select sum(total_cents) from filtered_orders where payment_status='paid' and (created_at at time zone 'Europe/Madrid')::date=(now() at time zone 'Europe/Madrid')::date),0),
      'cancelled_cents',coalesce((select sum(total_cents) from filtered_orders where status='cancelled'),0),
      'refunded_cents',coalesce((select sum(total_cents) from filtered_orders where payment_status in('refunded','partially_refunded')),0),
      'average_ticket_cents',coalesce((select round(avg(total_cents)) from valid_orders),0),
      'paid_orders',coalesce((select count(*) from valid_orders),0)
    ) else null end,
    'orders_by_status',coalesce((select jsonb_object_agg(key,value) from status_counts),'{}'::jsonb),
    'units_sold',coalesce((select sum(units) from item_metrics),0),
    'ready_orders',coalesce((select count(*) from filtered_orders where status='ready'),0),
    'pending_orders',coalesce((select count(*) from filtered_orders where status in('confirmed','payment_processing')),0),
    'failed_payments',coalesce((select count(*) from filtered_orders where payment_status='failed'),0),
    'collected_orders',coalesce((select count(*) from filtered_orders where status='collected'),0),
    'collection_rate',coalesce((select round(100.0*count(*) filter(where status='collected')/nullif(count(*) filter(where status in('confirmed','ready','collected')),0),1) from filtered_orders),0),
    'average_ready_hours',coalesce((select round(avg(extract(epoch from(h.created_at-o.confirmed_at))/3600)::numeric,1) from filtered_orders o join public.order_status_history h on h.order_id=o.id and h.new_status='ready' where o.confirmed_at is not null),0),
    'production',(select to_jsonb(production) from production),
    'production_today',coalesce((select sum(planned_quantity) from public.production_batches where production_date=(now() at time zone 'Europe/Madrid')::date),0),
    'production_tomorrow',coalesce((select sum(planned_quantity) from public.production_batches where production_date=(now() at time zone 'Europe/Madrid')::date+1),0),
    'open_incidents',coalesce((select count(*) from public.production_incidents where status in('open','in_progress')),0),
    'incidents',coalesce((select jsonb_agg(to_jsonb(incident_counts)) from incident_counts),'[]'::jsonb),
    'subscriptions',jsonb_build_object(
      'active',coalesce((select count(*) from public.subscriptions where status='active'),0),
      'paused',coalesce((select count(*) from public.subscriptions where status='paused'),0),
      'past_due',coalesce((select count(*) from public.subscriptions where status='past_due'),0),
      'cancelled',coalesce((select count(*) from public.subscriptions where status='cancelled' and cancelled_at::date between p_start and p_end),0),
      'new',coalesce((select count(*) from public.subscriptions where (created_at at time zone 'Europe/Madrid')::date between p_start and p_end),0),
      'cycles',coalesce((select count(*) from public.subscription_cycles where collection_date between p_start and p_end),0),
      'reserved_capacity',coalesce((select sum(quantity) from public.subscription_capacity_allocations where allocation_date between p_start and p_end),0)
      ,'recurring_revenue_cents',coalesce((select sum(total_cents) from valid_orders where order_type='subscription'),0)
      ,'cancellation_rate',coalesce((select round(100.0*count(*) filter(where status='cancelled')/nullif(count(*),0),1) from public.subscriptions),0)
    ),
    'customers',case when commercial then jsonb_build_object(
      'new',coalesce((select count(distinct customer_id) from valid_orders where customer_id is not null and not exists(select 1 from public.orders older where older.customer_id=valid_orders.customer_id and older.created_at<valid_orders.created_at and older.payment_status='paid')),0),
      'returning',coalesce((select count(*) from (select customer_id from valid_orders where customer_id is not null group by customer_id having count(*)>1) r),0),
      'authenticated',coalesce((select count(*) from valid_orders where customer_id is not null),0),
      'guests',coalesce((select count(*) from valid_orders where customer_id is null),0),
      'subscribers',coalesce((select count(distinct customer_id) from public.subscriptions where status in('active','paused','past_due')),0)
    ) else null end,
    'daily_sales',case when commercial then coalesce((select jsonb_agg(to_jsonb(daily_sales)) from daily_sales),'[]'::jsonb) else '[]'::jsonb end,
    'products',case when commercial then coalesce((select jsonb_agg(to_jsonb(item_metrics) order by units desc) from item_metrics),'[]'::jsonb) else '[]'::jsonb end,
    'points',case when commercial then coalesce((select jsonb_agg(to_jsonb(point_metrics) order by units desc) from point_metrics),'[]'::jsonb) else '[]'::jsonb end
  ) into result;
  return result;
end$$;

revoke all on function public.get_business_analytics(date,date,uuid,uuid,text) from public;
grant execute on function public.get_business_analytics(date,date,uuid,uuid,text) to authenticated;
