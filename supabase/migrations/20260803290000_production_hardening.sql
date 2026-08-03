-- Fase 13: rate limiting persistente, alertas de integridade e saúde operacional.
create table public.rate_limit_buckets(
  key_hash text not null, resource text not null, window_start timestamptz not null,
  attempts integer not null default 1 check(attempts>0), blocked_until timestamptz,
  primary key(key_hash,resource,window_start)
);
create index rate_limit_cleanup_idx on public.rate_limit_buckets(window_start);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon,authenticated;

create or replace function public.consume_rate_limit(p_key text,p_resource text,p_limit integer,p_window_seconds integer)
returns table(allowed boolean,retry_after_seconds integer) language plpgsql security definer set search_path='' as $$
declare bucket timestamptz; current_attempts integer; hash text;
begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;
 if p_limit<1 or p_window_seconds<1 or length(p_resource)>80 then raise exception 'invalid_rate_limit' using errcode='22023';end if;
 hash:=encode(extensions.digest(p_key,'sha256'),'hex');
 bucket:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into public.rate_limit_buckets(key_hash,resource,window_start,attempts) values(hash,p_resource,bucket,1)
 on conflict(key_hash,resource,window_start) do update set attempts=public.rate_limit_buckets.attempts+1 returning attempts into current_attempts;
 return query select current_attempts<=p_limit,greatest(0,ceil(extract(epoch from(bucket+make_interval(secs=>p_window_seconds)-now())))::integer);
end$$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;

create table public.system_integrity_alerts(
 id uuid primary key default gen_random_uuid(),alert_key text not null unique,type text not null,severity text not null check(severity in('low','medium','high','critical')),
 entity_type text,entity_id text,description text not null,status text not null default 'open' check(status in('open','resolved','dismissed')),
 detected_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),resolved_at timestamptz,metadata jsonb not null default '{}'::jsonb
);
create index integrity_alerts_status_idx on public.system_integrity_alerts(status,severity,last_seen_at desc);
alter table public.system_integrity_alerts enable row level security;
create policy integrity_alerts_admin_read on public.system_integrity_alerts for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin'));
grant select on public.system_integrity_alerts to authenticated;

create or replace function public.run_integrity_audit() returns jsonb language plpgsql security definer set search_path='' as $$declare found_count integer:=0;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;
 if not pg_try_advisory_xact_lock(13,290000) then return jsonb_build_object('skipped','concurrent_run');end if;
 insert into public.system_integrity_alerts(alert_key,type,severity,entity_type,entity_id,description)
 select 'paid_without_items:'||o.id,'order_without_items','critical','orders',o.id::text,'Pedido pagado sin líneas.' from public.orders o where o.payment_status='paid' and not exists(select 1 from public.order_items i where i.order_id=o.id)
 on conflict(alert_key) do update set last_seen_at=now(),status='open';get diagnostics found_count=row_count;
 insert into public.system_integrity_alerts(alert_key,type,severity,entity_type,entity_id,description)
 select 'paid_cycle_without_order:'||c.id,'cycle_without_order','critical','subscription_cycles',c.id::text,'Ciclo pagado sin pedido.' from public.subscription_cycles c where c.status in('paid','order_created') and c.order_id is null
 on conflict(alert_key) do update set last_seen_at=now(),status='open';
 insert into public.system_integrity_alerts(alert_key,type,severity,entity_type,entity_id,description)
 select 'invalid_push:'||p.id,'invalid_push','low','push_subscriptions',p.id::text,'Dispositivo push inválido pendiente de revisión.' from public.push_subscriptions p where p.status='invalid'
 on conflict(alert_key) do update set last_seen_at=now(),status='open';
 insert into public.system_integrity_alerts(alert_key,type,severity,entity_type,entity_id,description)
 select 'critical_email:'||e.id,'critical_email_failed','high','notification_events',e.id::text,'Comunicación crítica agotó los reintentos.' from public.notification_events e where e.priority='critical' and e.status='failed'
 on conflict(alert_key) do update set last_seen_at=now(),status='open';
 insert into public.system_integrity_alerts(alert_key,type,severity,entity_type,entity_id,description)
 select 'production:'||b.id,'production_mismatch','high','production_batches',b.id::text,'Producción incompatible con lo planificado.' from public.production_batches b where b.status='requires_attention' or b.packed_quantity>b.produced_quantity
 on conflict(alert_key) do update set last_seen_at=now(),status='open';
 insert into public.audit_logs(action,entity_type,new_data) values('system.integrity_audited','system',jsonb_build_object('initial_matches',found_count));
 return jsonb_build_object('status','completed','initial_matches',found_count);
end$$;
revoke all on function public.run_integrity_audit() from public;grant execute on function public.run_integrity_audit() to service_role;

insert into public.app_settings(key,value,description,is_public) values
('legal.controller_name','null','Responsable legal pendiente de validación',false),
('legal.tax_id','null','Identificación fiscal pendiente',false),
('legal.fiscal_address','null','Domicilio fiscal pendiente',false),
('legal.contact_email','null','Email legal pendiente',false),
('legal.documents_version','"draft-2026-08"','Versión de textos legales',false)
on conflict(key) do nothing;
