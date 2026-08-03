-- Fase 7: compra avulsa, pagos anticipados e historial inmutable.
create type public.payment_status as enum ('not_started','pending','processing','paid','failed','cancelled','refunded','partially_refunded');
create type public.order_event_source as enum ('customer','admin','operator','stripe_webhook','system');
create type public.payment_event_status as enum ('received','processed','ignored','failed');
alter type public.order_status add value if not exists 'draft' before 'pending_payment';
alter type public.order_status add value if not exists 'payment_processing' after 'pending_payment';
alter type public.order_status add value if not exists 'ready' after 'confirmed';
alter type public.order_status add value if not exists 'collected' after 'ready';
alter type public.order_status add value if not exists 'partially_refunded' after 'refunded';

alter table public.orders add column customer_name text, add column customer_email text, add column customer_phone text, add column billing_country text not null default 'ES',
 add column stripe_payment_intent_id text unique, add column stripe_customer_id text,
 add column payment_status public.payment_status not null default 'not_started', add column payment_expires_at timestamptz,
 add column reservation_id uuid references public.stock_reservations(id), add column subtotal_cents integer not null default 0 check(subtotal_cents>=0),
 add column tax_cents integer not null default 0 check(tax_cents>=0), add column terms_version text,
 add column privacy_version text, add column marketing_consent boolean not null default false,
 add column cancelled_at timestamptz, add column cancellation_reason text, add column lookup_token_hash text unique,
 add column internal_note text, add column requires_review boolean not null default false, add column checkout_key text unique;
alter table public.order_items add column product_id uuid references public.products(id) on delete restrict,
 add column approximate_weight_snapshot integer, add column vat_rate_snapshot numeric(5,2) not null default 0,
 add column tax_cents integer not null default 0 check(tax_cents>=0);
alter table public.stock_reservations add column order_id uuid references public.orders(id) on delete set null;
create index orders_payment_status_idx on public.orders(payment_status,created_at desc);
create index orders_public_lookup_idx on public.orders(public_code,lookup_token_hash);
create index reservations_order_idx on public.stock_reservations(order_id);

create table public.order_status_history(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,previous_status public.order_status,new_status public.order_status not null,actor_id uuid references auth.users(id) on delete set null,source public.order_event_source not null,reason text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index order_status_history_order_idx on public.order_status_history(order_id,created_at);
create table public.payment_events(id uuid primary key default gen_random_uuid(),stripe_event_id text not null unique,event_type text not null,payment_intent_id text,order_id uuid references public.orders(id) on delete set null,processing_status public.payment_event_status not null default 'received',payload_hash text,error_message text,processed_at timestamptz,created_at timestamptz not null default now());
create index payment_events_intent_idx on public.payment_events(payment_intent_id);

create or replace function app_private.forbid_confirmed_order_item_change() returns trigger language plpgsql set search_path='' as $$begin if exists(select 1 from public.orders where id=old.order_id and status not in ('draft','pending_payment')) then raise exception 'confirmed_order_items_immutable' using errcode='0A000';end if;return old;end$$;
drop trigger if exists order_items_forbid_update on public.order_items;
create trigger order_items_forbid_change before update or delete on public.order_items for each row execute function app_private.forbid_confirmed_order_item_change();

create or replace function public.create_checkout_order(p_items jsonb,p_pickup_point_id uuid,p_collection_date date,p_session_key text,p_customer_id uuid,p_name text,p_email text,p_phone text,p_terms_version text,p_privacy_version text,p_marketing boolean,p_lookup_hash text)
returns table(ok boolean,reason text,order_id uuid,public_code text,total_cents integer,expires_at timestamptz) language plpgsql security definer set search_path='' as $$
declare i jsonb;v record;av record;o public.orders;oid uuid;rid uuid;code text;subtotal integer:=0;tax integer:=0;line integer;line_tax integer;expiry timestamptz:=now()+interval '15 minutes';qty integer;vid uuid;
begin
 select * into o from public.orders where checkout_key=p_session_key;if found then return query select true,'already_created',o.id,o.public_code,o.total_cents,o.payment_expires_at;return;end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or trim(coalesce(p_name,''))='' or position('@' in coalesce(p_email,''))<2 or trim(coalesce(p_phone,''))='' or p_terms_version is null or p_privacy_version is null then return query select false,'invalid_checkout',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
 if p_customer_id is not null and p_customer_id<>auth.uid() and auth.role()<>'service_role' then raise exception 'insufficient_privilege' using errcode='42501';end if;
 perform public.expire_stock_reservations();
 for i in select value from jsonb_array_elements(p_items) order by value->>'variant_id' loop
  vid:=(i->>'variant_id')::uuid;qty:=(i->>'quantity')::integer;if qty<=0 then return query select false,'invalid_quantity',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
  perform pg_advisory_xact_lock(1,hashtext(vid::text||p_collection_date::text));perform pg_advisory_xact_lock(2,hashtext(p_pickup_point_id::text||p_collection_date::text));
  select pv.*,p.name product_name,p.status product_status into v from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=vid;
  if not found or v.status<>'active' or v.product_status not in('active','seasonal') or v.price_cents is null then return query select false,'variant_unavailable',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
  select * into av from app_private.variant_availability(vid,p_pickup_point_id,p_collection_date);if not av.is_available or qty>av.remaining then return query select false,coalesce(av.reason,'sold_out'),null::uuid,null::text,null::integer,null::timestamptz;return;end if;
 end loop;
 code:='FZ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.orders(public_code,customer_id,customer_name,customer_email,customer_phone,pickup_point_id,collection_date,status,payment_status,payment_expires_at,subtotal_cents,tax_cents,total_cents,currency,terms_version,privacy_version,marketing_consent,lookup_token_hash,checkout_key)
 values(code,p_customer_id,trim(p_name),lower(trim(p_email)),trim(p_phone),p_pickup_point_id,p_collection_date,'pending_payment','pending',expiry,0,0,0,'EUR',p_terms_version,p_privacy_version,coalesce(p_marketing,false),p_lookup_hash,p_session_key) returning id into oid;
 for i in select value from jsonb_array_elements(p_items) loop vid:=(i->>'variant_id')::uuid;qty:=(i->>'quantity')::integer;select pv.*,p.id product_id,p.name product_name into v from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=vid;line:=v.price_cents*qty;line_tax:=round(line*(v.vat_rate/(100+v.vat_rate)));subtotal:=subtotal+line-line_tax;tax:=tax+line_tax;
  insert into public.stock_reservations(token,session_key,customer_id,product_variant_id,pickup_point_id,collection_date,quantity,status,expires_at,order_id) values(encode(gen_random_bytes(32),'hex'),p_session_key,p_customer_id,vid,p_pickup_point_id,p_collection_date,qty,'active',expiry,oid) returning id into rid;
  if (select reservation_id is null from public.orders where id=oid) then update public.orders set reservation_id=rid where id=oid;end if;
  insert into public.order_items(order_id,product_id,product_variant_id,product_name_snapshot,variant_name_snapshot,approximate_weight_snapshot,unit_price_cents,vat_rate_snapshot,tax_cents,quantity,line_total_cents) values(oid,v.product_id,vid,v.product_name,v.name,v.approximate_weight_grams,v.price_cents,v.vat_rate,line_tax,qty,line);
 end loop;
 update public.orders set subtotal_cents=subtotal,tax_cents=tax,total_cents=subtotal+tax where id=oid;insert into public.order_status_history(order_id,new_status,actor_id,source,reason) values(oid,'pending_payment',p_customer_id,'customer','checkout_created');insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_data) values(p_customer_id,'order.created','orders',oid::text,jsonb_build_object('public_code',code,'total_cents',subtotal+tax));return query select true,'pending_payment',oid,code,subtotal+tax,expiry;
end$$;

create or replace function public.process_payment_event(p_event_id text,p_event_type text,p_payment_intent text,p_amount integer,p_currency text,p_payload_hash text)
returns table(ok boolean,reason text,order_id uuid,public_code text) language plpgsql security definer set search_path='' as $$declare o public.orders;existing public.payment_events;target public.order_status;pay public.payment_status;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;
 select * into existing from public.payment_events where stripe_event_id=p_event_id;if found then select * into o from public.orders where id=existing.order_id;return query select true,'already_processed',o.id,o.public_code;return;end if;
 select * into o from public.orders where stripe_payment_intent_id=p_payment_intent for update;insert into public.payment_events(stripe_event_id,event_type,payment_intent_id,order_id,payload_hash) values(p_event_id,p_event_type,p_payment_intent,o.id,p_payload_hash);
 if o.id is null then update public.payment_events set processing_status='ignored',processed_at=now(),error_message='order_not_found' where stripe_event_id=p_event_id;return query select false,'order_not_found',null::uuid,null::text;return;end if;
 if p_event_type='payment_intent.succeeded' then
  if p_amount<>o.total_cents or upper(p_currency)<>o.currency then update public.orders set requires_review=true where id=o.id;update public.payment_events set processing_status='failed',processed_at=now(),error_message='amount_mismatch' where stripe_event_id=p_event_id;return query select false,'amount_mismatch',o.id,o.public_code;return;end if;
  if o.payment_expires_at<now() or exists(select 1 from public.stock_reservations where order_id=o.id and (status<>'active' or expires_at<now())) then update public.orders set payment_status='paid',requires_review=true where id=o.id;update public.payment_events set processing_status='processed',processed_at=now() where stripe_event_id=p_event_id;return query select false,'late_payment_review',o.id,o.public_code;return;end if;
  target:='confirmed';pay:='paid';update public.stock_reservations set status='converted',converted_order_id=o.id where order_id=o.id and status='active';update public.orders set status=target,payment_status=pay,confirmed_at=coalesce(confirmed_at,now()) where id=o.id;
 elsif p_event_type='payment_intent.processing' then target:='payment_processing';pay:='processing';update public.orders set status=target,payment_status=pay where id=o.id;
 elsif p_event_type in('payment_intent.payment_failed','payment_intent.canceled') then target:='cancelled';pay:=case when p_event_type like '%failed' then 'failed' else 'cancelled' end;update public.orders set status=target,payment_status=pay,cancelled_at=now(),cancellation_reason=p_event_type where id=o.id;update public.stock_reservations set status='released' where order_id=o.id and status='active';
 elsif p_event_type in('charge.refunded','charge.refund.updated') then target:='refunded';pay:='refunded';update public.orders set status=target,payment_status=pay where id=o.id;else update public.payment_events set processing_status='ignored',processed_at=now() where stripe_event_id=p_event_id;return query select true,'ignored',o.id,o.public_code;return;end if;
 insert into public.order_status_history(order_id,previous_status,new_status,source,reason) values(o.id,o.status,target,'stripe_webhook',p_event_type);update public.payment_events set processing_status='processed',processed_at=now() where stripe_event_id=p_event_id;insert into public.audit_logs(action,entity_type,entity_id,new_data) values('payment.event','orders',o.id::text,jsonb_build_object('event_type',p_event_type,'payment_status',pay));return query select true,'processed',o.id,o.public_code;
end$$;

alter table public.order_status_history enable row level security;alter table public.payment_events enable row level security;
create policy order_history_customer_read on public.order_status_history for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()) or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
create policy payment_events_admin_read on public.payment_events for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin'));
drop policy if exists orders_customer_read on public.orders;create policy orders_customer_read on public.orders for select to authenticated using(customer_id=auth.uid() or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
drop policy if exists order_items_customer_read on public.order_items;create policy order_items_customer_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=auth.uid() or app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'))));
grant select on public.orders,public.order_items,public.order_status_history to authenticated;grant select on public.payment_events to authenticated;revoke all on function public.create_checkout_order(jsonb,uuid,date,text,uuid,text,text,text,text,text,boolean,text) from public;grant execute on function public.create_checkout_order(jsonb,uuid,date,text,uuid,text,text,text,text,text,boolean,text) to anon,authenticated,service_role;revoke all on function public.process_payment_event(text,text,text,integer,text,text) from public;grant execute on function public.process_payment_event(text,text,text,integer,text,text) to service_role;
