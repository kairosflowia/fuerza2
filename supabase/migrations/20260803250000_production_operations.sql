-- Fase 9: execução de produção derivada exclusivamente de pedidos pagos.
create type public.production_batch_status as enum ('planned','in_progress','produced','packed','completed','cancelled','requires_attention');
create type public.production_allocation_status as enum ('pending','packing','packed','dispatched','received','completed','requires_attention');
create type public.fulfillment_status as enum ('pending','in_production','produced','packed','ready','collected','cancelled','issue');
create type public.production_incident_type as enum ('capacity_mismatch','missing_product','quality_issue','delayed_production','pickup_point_issue','customer_issue','payment_mismatch','order_change','other');
create type public.incident_severity as enum ('low','medium','high','critical');
create type public.incident_status as enum ('open','in_progress','resolved','dismissed');

create table public.production_batches (
 id uuid primary key default gen_random_uuid(), production_date date not null,
 product_variant_id uuid not null references public.product_variants(id) on delete restrict,
 planned_quantity integer not null default 0 check(planned_quantity>=0), adjusted_quantity integer check(adjusted_quantity>=0),
 produced_quantity integer not null default 0 check(produced_quantity>=0), packed_quantity integer not null default 0 check(packed_quantity>=0),
 status public.production_batch_status not null default 'planned', notes text, created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(production_date,product_variant_id)
);
create table public.production_batch_allocations (
 id uuid primary key default gen_random_uuid(), production_batch_id uuid not null references public.production_batches(id) on delete cascade,
 pickup_point_id uuid not null references public.pickup_points(id) on delete restrict, planned_quantity integer not null default 0 check(planned_quantity>=0),
 packed_quantity integer not null default 0 check(packed_quantity>=0), dispatched_quantity integer not null default 0 check(dispatched_quantity>=0),
 received_quantity integer check(received_quantity>=0), status public.production_allocation_status not null default 'pending',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(production_batch_id,pickup_point_id)
);
create table public.order_fulfillment_items (
 id uuid primary key default gen_random_uuid(), order_item_id uuid not null unique references public.order_items(id) on delete cascade,
 production_batch_id uuid references public.production_batches(id) on delete set null, status public.fulfillment_status not null default 'pending',
 quantity_required integer not null check(quantity_required>0), quantity_prepared integer not null default 0 check(quantity_prepared>=0),
 issue_code text, notes text, updated_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.production_incidents (
 id uuid primary key default gen_random_uuid(), production_date date not null, production_batch_id uuid references public.production_batches(id) on delete set null,
 order_id uuid references public.orders(id) on delete set null, order_item_id uuid references public.order_items(id) on delete set null,
 pickup_point_id uuid references public.pickup_points(id) on delete set null, type public.production_incident_type not null,
 severity public.incident_severity not null default 'medium', status public.incident_status not null default 'open', description text not null check(length(trim(description))>0),
 resolution text, created_by uuid references auth.users(id), resolved_by uuid references auth.users(id), created_at timestamptz not null default now(),
 resolved_at timestamptz, updated_at timestamptz not null default now()
);
create index production_batches_date_status_idx on public.production_batches(production_date,status);
create index production_allocations_point_idx on public.production_batch_allocations(pickup_point_id,status);
create index fulfillment_batch_status_idx on public.order_fulfillment_items(production_batch_id,status);
create index incidents_date_status_idx on public.production_incidents(production_date,status,severity);
create trigger production_batches_updated before update on public.production_batches for each row execute function app_private.set_updated_at();
create trigger production_allocations_updated before update on public.production_batch_allocations for each row execute function app_private.set_updated_at();
create trigger fulfillment_updated before update on public.order_fulfillment_items for each row execute function app_private.set_updated_at();
create trigger incidents_updated before update on public.production_incidents for each row execute function app_private.set_updated_at();

insert into public.app_settings(key,value,description,is_public) values
 ('production.batch_generation_days_ahead','7','Horizonte de generación de lotes',false),
 ('production.stale_ready_order_hours','4','Horas antes de revisar pedidos listos no recogidos',false),
 ('production.reconciliation_interval','"daily"','Cadencia operativa orientativa',false)
on conflict(key) do nothing;

create or replace function app_private.is_production_staff() returns boolean language sql stable security definer set search_path='' as $$select app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator')$$;

create or replace function public.generate_production_batches(p_date date) returns jsonb language plpgsql security definer set search_path='' as $$
declare batch_count integer; fulfillment_count integer; allocation_count integer;
begin
 if not app_private.is_production_staff() and auth.role()<>'service_role' then raise exception 'insufficient_privilege' using errcode='42501';end if;
 perform pg_advisory_xact_lock(9,hashtext(p_date::text));
 with required as(
  select oi.product_variant_id,sum(oi.quantity)::integer qty from public.orders o join public.order_items oi on oi.order_id=o.id
  where o.collection_date=p_date and o.status in('confirmed','ready') and o.payment_status='paid' group by oi.product_variant_id
 )
 insert into public.production_batches(production_date,product_variant_id,planned_quantity,created_by)
 select p_date,product_variant_id,qty,auth.uid() from required
 on conflict(production_date,product_variant_id) do update set planned_quantity=excluded.planned_quantity,
  status=case when public.production_batches.produced_quantity>excluded.planned_quantity then 'requires_attention'::public.production_batch_status else public.production_batches.status end;
 get diagnostics batch_count=row_count;
 insert into public.order_fulfillment_items(order_item_id,production_batch_id,quantity_required,updated_by)
 select oi.id,b.id,oi.quantity,auth.uid() from public.orders o join public.order_items oi on oi.order_id=o.id
 join public.production_batches b on b.production_date=o.collection_date and b.product_variant_id=oi.product_variant_id
 where o.collection_date=p_date and o.status in('confirmed','ready') and o.payment_status='paid'
 on conflict(order_item_id) do update set production_batch_id=excluded.production_batch_id,quantity_required=excluded.quantity_required;
 get diagnostics fulfillment_count=row_count;
 with required as(
  select b.id batch_id,o.pickup_point_id,sum(oi.quantity)::integer qty from public.orders o join public.order_items oi on oi.order_id=o.id
  join public.production_batches b on b.production_date=o.collection_date and b.product_variant_id=oi.product_variant_id
  where o.collection_date=p_date and o.status in('confirmed','ready') and o.payment_status='paid' group by b.id,o.pickup_point_id
 ) insert into public.production_batch_allocations(production_batch_id,pickup_point_id,planned_quantity)
 select batch_id,pickup_point_id,qty from required on conflict(production_batch_id,pickup_point_id) do update set planned_quantity=excluded.planned_quantity;
 get diagnostics allocation_count=row_count;
 update public.order_fulfillment_items f set status='cancelled',updated_by=auth.uid() from public.order_items oi join public.orders o on o.id=oi.order_id where f.order_item_id=oi.id and o.collection_date=p_date and o.status='cancelled' and f.status not in('collected','cancelled');
 insert into public.production_incidents(production_date,production_batch_id,type,severity,description,created_by)
 select p_date,b.id,'order_change','high','La demanda confirmada quedó por debajo de la cantidad ya producida.',auth.uid() from public.production_batches b
 where b.production_date=p_date and b.produced_quantity>b.planned_quantity and not exists(select 1 from public.production_incidents i where i.production_batch_id=b.id and i.type='order_change' and i.status in('open','in_progress'));
 insert into public.audit_logs(actor_id,action,entity_type,new_data) values(auth.uid(),'production.generated','production_batches',jsonb_build_object('date',p_date,'batches',batch_count,'fulfillment',fulfillment_count));
 return jsonb_build_object('batches',batch_count,'allocations',allocation_count,'fulfillment',fulfillment_count);
end$$;

create or replace function public.update_production_batch(p_batch_id uuid,p_produced integer,p_packed integer,p_status public.production_batch_status,p_notes text,p_expected_updated_at timestamptz) returns public.production_batches language plpgsql security definer set search_path='' as $$
declare b public.production_batches; target integer;
begin
 if not app_private.is_production_staff() then raise exception 'insufficient_privilege' using errcode='42501';end if;
 select * into b from public.production_batches where id=p_batch_id for update;if not found then raise exception 'batch_not_found';end if;
 if p_expected_updated_at is not null and b.updated_at<>p_expected_updated_at then raise exception 'stale_batch_update' using errcode='40001';end if;
 target:=coalesce(b.adjusted_quantity,b.planned_quantity);
 if p_produced<0 or p_packed<0 or p_packed>p_produced then raise exception 'invalid_quantities' using errcode='23514';end if;
 if p_status='completed' and (p_packed<target or exists(select 1 from public.order_fulfillment_items where production_batch_id=b.id and status not in('ready','collected','cancelled'))) then raise exception 'batch_not_complete' using errcode='23514';end if;
 update public.production_batches set produced_quantity=p_produced,packed_quantity=p_packed,status=p_status,notes=nullif(trim(p_notes),'') where id=b.id returning * into b;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_data) values(auth.uid(),'production.batch.updated','production_batches',b.id::text,jsonb_build_object('produced',p_produced,'packed',p_packed,'status',p_status));return b;
end$$;

create or replace function public.adjust_production_batch(p_batch_id uuid,p_quantity integer,p_reason text) returns void language plpgsql security definer set search_path='' as $$declare b public.production_batches;begin
 if not(app_private.has_role('owner') or app_private.has_role('admin')) then raise exception 'insufficient_privilege' using errcode='42501';end if;
 select * into b from public.production_batches where id=p_batch_id for update;if p_quantity<b.planned_quantity or trim(coalesce(p_reason,''))='' then raise exception 'adjustment_requires_capacity_and_reason' using errcode='23514';end if;
 update public.production_batches set adjusted_quantity=p_quantity where id=p_batch_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,previous_data,new_data) values(auth.uid(),'production.batch.adjusted','production_batches',p_batch_id::text,jsonb_build_object('adjusted',b.adjusted_quantity),jsonb_build_object('adjusted',p_quantity,'reason',p_reason));end$$;

create or replace function public.set_fulfillment_status(p_order_item_id uuid,p_status public.fulfillment_status,p_quantity integer default null,p_note text default null) returns void language plpgsql security definer set search_path='' as $$declare f public.order_fulfillment_items;allowed boolean:=false;begin
 if not app_private.is_production_staff() then raise exception 'insufficient_privilege' using errcode='42501';end if;select * into f from public.order_fulfillment_items where order_item_id=p_order_item_id for update;if not found then raise exception 'fulfillment_not_found';end if;
 allowed:=(f.status=p_status) or (f.status='pending' and p_status in('in_production','cancelled','issue')) or (f.status='in_production' and p_status in('produced','issue')) or (f.status='produced' and p_status in('packed','issue')) or (f.status='packed' and p_status in('ready','issue')) or (f.status='ready' and p_status in('collected','issue')) or (f.status='issue' and p_status in('pending','in_production','produced','packed','ready'));
 if not allowed then raise exception 'invalid_fulfillment_transition' using errcode='23514';end if;
 update public.order_fulfillment_items set status=p_status,quantity_prepared=coalesce(p_quantity,quantity_prepared),notes=coalesce(nullif(trim(p_note),''),notes),updated_by=auth.uid() where id=f.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_data) values(auth.uid(),'fulfillment.'||p_status,'order_fulfillment_items',f.id::text,jsonb_build_object('previous',f.status,'quantity',p_quantity));end$$;

create or replace function public.set_order_fulfillment_status(p_order_id uuid,p_status public.order_status,p_override_reason text default null) returns void language plpgsql security definer set search_path='' as $$declare o public.orders;bad integer;begin
 if not app_private.is_production_staff() then raise exception 'insufficient_privilege' using errcode='42501';end if;select * into o from public.orders where id=p_order_id for update;if not found then raise exception 'order_not_found';end if;if o.status=p_status then return;end if;
 if p_status='ready' then select count(*) into bad from public.order_items oi left join public.order_fulfillment_items f on f.order_item_id=oi.id where oi.order_id=o.id and coalesce(f.status::text,'pending') not in('ready','collected');if bad>0 then raise exception 'items_not_ready' using errcode='23514';end if;if o.status not in('confirmed','ready') then raise exception 'invalid_order_transition' using errcode='23514';end if;
 elsif p_status='collected' then if o.status<>'ready' and not((app_private.has_role('owner') or app_private.has_role('admin')) and trim(coalesce(p_override_reason,''))<>'') then raise exception 'order_not_ready' using errcode='23514';end if;update public.order_fulfillment_items f set status='collected',updated_by=auth.uid() from public.order_items oi where f.order_item_id=oi.id and oi.order_id=o.id and f.status='ready';else raise exception 'unsupported_order_status';end if;
 if o.status<>p_status then update public.orders set status=p_status where id=o.id;insert into public.order_status_history(order_id,previous_status,new_status,actor_id,source,reason) values(o.id,o.status,p_status,auth.uid(),case when app_private.has_role('operator') then 'operator' else 'admin' end,p_override_reason);end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_data) values(auth.uid(),'order.'||p_status,'orders',o.id::text,jsonb_build_object('override_reason',p_override_reason));end$$;

create or replace function public.reconcile_production(p_date date) returns jsonb language plpgsql security definer set search_path='' as $$declare generated jsonb;issues integer;begin
 generated:=public.generate_production_batches(p_date);
 insert into public.production_incidents(production_date,order_id,type,severity,description,created_by)
 select p_date,o.id,'missing_product','high','Pedido confirmado sin estado operativo completo.',auth.uid() from public.orders o where o.collection_date=p_date and o.status in('confirmed','ready') and o.payment_status='paid' and exists(select 1 from public.order_items oi left join public.order_fulfillment_items f on f.order_item_id=oi.id where oi.order_id=o.id and f.id is null) and not exists(select 1 from public.production_incidents i where i.order_id=o.id and i.type='missing_product' and i.status in('open','in_progress'));
 get diagnostics issues=row_count;return generated||jsonb_build_object('incidents',issues);end$$;

create or replace function public.run_production_jobs() returns jsonb language plpgsql security definer set search_path='' as $$declare horizon integer;day date;processed integer:=0;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;
 if not pg_try_advisory_xact_lock(9,250000) then return jsonb_build_object('skipped','concurrent_run');end if;
 select (value#>>'{}')::integer into horizon from public.app_settings where key='production.batch_generation_days_ahead';horizon:=coalesce(horizon,7);
 for day in select generate_series(current_date,current_date+horizon,'1 day'::interval)::date loop perform public.reconcile_production(day);processed:=processed+1;end loop;
 insert into public.production_incidents(production_date,order_id,type,severity,description)
 select o.collection_date,o.id,'customer_issue','medium','Pedido listo no recogido dentro del margen configurado.' from public.orders o
 where o.status='ready' and o.collection_date<current_date and not exists(select 1 from public.production_incidents i where i.order_id=o.id and i.type='customer_issue' and i.status in('open','in_progress'));
 return jsonb_build_object('dates_processed',processed);end$$;

alter table public.production_batches enable row level security;alter table public.production_batch_allocations enable row level security;alter table public.order_fulfillment_items enable row level security;alter table public.production_incidents enable row level security;
create policy production_batches_staff_read on public.production_batches for select to authenticated using(app_private.is_production_staff());
create policy production_allocations_staff_read on public.production_batch_allocations for select to authenticated using(app_private.is_production_staff());
create policy fulfillment_staff_read on public.order_fulfillment_items for select to authenticated using(app_private.is_production_staff());
create policy incidents_staff_read on public.production_incidents for select to authenticated using(app_private.is_production_staff());
create policy incidents_staff_create on public.production_incidents for insert to authenticated with check(app_private.is_production_staff() and created_by=auth.uid());
create policy incidents_staff_update on public.production_incidents for update to authenticated using(app_private.is_production_staff()) with check(app_private.is_production_staff());
grant select on public.production_batches,public.production_batch_allocations,public.order_fulfillment_items,public.production_incidents to authenticated;
grant insert,update on public.production_incidents to authenticated;
revoke all on function public.generate_production_batches(date),public.update_production_batch(uuid,integer,integer,public.production_batch_status,text,timestamptz),public.adjust_production_batch(uuid,integer,text),public.set_fulfillment_status(uuid,public.fulfillment_status,integer,text),public.set_order_fulfillment_status(uuid,public.order_status,text),public.reconcile_production(date) from public;
grant execute on function public.generate_production_batches(date),public.update_production_batch(uuid,integer,integer,public.production_batch_status,text,timestamptz),public.set_fulfillment_status(uuid,public.fulfillment_status,integer,text),public.set_order_fulfillment_status(uuid,public.order_status,text),public.reconcile_production(date) to authenticated,service_role;
grant execute on function public.adjust_production_batch(uuid,integer,text) to authenticated,service_role;
revoke all on function public.run_production_jobs() from public;grant execute on function public.run_production_jobs() to service_role;
alter publication supabase_realtime add table public.production_incidents;
