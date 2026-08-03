-- Fase 11: canal push sobre os mesmos notification_events da outbox.
create type public.push_subscription_status as enum('active','expired','revoked','invalid');
create table public.push_subscriptions(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,endpoint_hash text not null unique,p256dh text not null,auth text not null,user_agent text,platform text not null default 'web',device_name text,
 status public.push_subscription_status not null default 'active',last_used_at timestamptz,expires_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index push_subscriptions_customer_status_idx on public.push_subscriptions(customer_id,status);
create trigger push_subscriptions_updated before update on public.push_subscriptions for each row execute function app_private.set_updated_at();

alter table public.notification_deliveries add column channel text not null default 'email' check(channel in('email','push')),
 add column push_subscription_id uuid references public.push_subscriptions(id) on delete set null;
do $$declare constraint_name text;begin select c.conname into constraint_name from pg_constraint c where c.conrelid='public.notification_deliveries'::regclass and c.contype='u' and pg_get_constraintdef(c.oid) like '%notification_event_id, attempt_number%';if constraint_name is not null then execute format('alter table public.notification_deliveries drop constraint %I',constraint_name);end if;end$$;
create unique index notification_delivery_channel_attempt_unique on public.notification_deliveries(notification_event_id,channel,coalesce(push_subscription_id,'00000000-0000-0000-0000-000000000000'::uuid),attempt_number);
alter table public.notification_preferences drop constraint notification_preferences_channel_check;
alter table public.notification_preferences add constraint notification_preferences_channel_check check(channel in('email','push'));

create or replace function public.register_push_subscription(p_endpoint text,p_p256dh text,p_auth text,p_user_agent text,p_platform text,p_device_name text default null) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid;hash text;begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if length(p_endpoint)<20 or length(p_endpoint)>4096 or p_endpoint!~'^https://' or length(p_p256dh)<20 or length(p_auth)<8 then raise exception 'invalid_push_subscription' using errcode='22023';end if;
 hash:=encode(extensions.digest(p_endpoint,'sha256'),'hex');
 insert into public.push_subscriptions(customer_id,endpoint,endpoint_hash,p256dh,auth,user_agent,platform,device_name,status,last_used_at)
 values(auth.uid(),p_endpoint,hash,p_p256dh,p_auth,left(p_user_agent,500),left(coalesce(p_platform,'web'),40),left(p_device_name,80),'active',now())
 on conflict(endpoint) do update set customer_id=auth.uid(),p256dh=excluded.p256dh,auth=excluded.auth,user_agent=excluded.user_agent,platform=excluded.platform,device_name=excluded.device_name,status='active',last_used_at=now() returning id into result;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'push.device.registered','push_subscriptions',result::text);return result;end$$;
create or replace function public.revoke_push_subscription(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$begin update public.push_subscriptions set status='revoked' where id=p_id and customer_id=auth.uid() and status<>'revoked';if found then insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'push.device.revoked','push_subscriptions',p_id::text);return true;end if;return false;end$$;

create view public.push_subscription_metadata as
select id,customer_id,platform,device_name,status,last_used_at,expires_at,created_at,updated_at
from public.push_subscriptions
where customer_id = auth.uid() or app_private.has_role('owner') or app_private.has_role('admin');
alter table public.push_subscriptions enable row level security;
create policy push_own_read on public.push_subscriptions for select to authenticated using(customer_id=auth.uid());
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check(customer_id=auth.uid());
create policy push_own_update on public.push_subscriptions for update to authenticated using(customer_id=auth.uid()) with check(customer_id=auth.uid());
grant select on public.push_subscriptions,public.push_subscription_metadata to authenticated;
revoke all on function public.register_push_subscription(text,text,text,text,text,text),public.revoke_push_subscription(uuid) from public;
grant execute on function public.register_push_subscription(text,text,text,text,text,text),public.revoke_push_subscription(uuid) to authenticated;
