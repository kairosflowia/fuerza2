-- Fase 10: outbox transacional e histórico de comunicações.
create type public.notification_template_status as enum('draft','active','archived');
create type public.notification_event_status as enum('pending','processing','sent','partially_sent','failed','cancelled','suppressed');
create type public.notification_priority as enum('critical','high','normal','low');
create type public.notification_delivery_status as enum('queued','sent','delivered','delayed','bounced','complained','failed','suppressed');
create type public.notification_category as enum('transactional','operational','subscription','reminder','marketing');

create table public.notification_templates(
 id uuid primary key default gen_random_uuid(),key text not null,name text not null,channel text not null default 'email' check(channel='email'),locale text not null default 'es-ES',
 subject_template text not null,body_html_template text not null,body_text_template text not null,status public.notification_template_status not null default 'draft',version integer not null check(version>0),
 description text,required_variables text[] not null default '{}',created_by uuid references auth.users(id),updated_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(key,locale,version),check(body_html_template!~*'<\s*script' and body_html_template!~*'javascript:' and body_html_template!~*'\son[a-z]+\s*=')
);
create unique index notification_template_one_active on public.notification_templates(key,locale) where status='active';
create table public.notification_events(
 id uuid primary key default gen_random_uuid(),event_key text not null,entity_type text not null,entity_id text not null,recipient_type text not null,
 recipient_id uuid,recipient_email text not null,locale text not null default 'es-ES',payload jsonb not null default '{}',idempotency_key text not null unique,
 priority public.notification_priority not null default 'normal',status public.notification_event_status not null default 'pending',scheduled_for timestamptz not null default now(),
 processing_started_at timestamptz,attempt_count integer not null default 0,last_error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.notification_deliveries(
 id uuid primary key default gen_random_uuid(),notification_event_id uuid not null references public.notification_events(id) on delete cascade,template_id uuid references public.notification_templates(id),template_version integer,
 provider text not null,provider_message_id text unique,recipient_email text not null,status public.notification_delivery_status not null default 'queued',attempt_number integer not null check(attempt_number>0),
 error_code text,error_message text,sent_at timestamptz,delivered_at timestamptz,bounced_at timestamptz,complained_at timestamptz,created_at timestamptz not null default now(),unique(notification_event_id,attempt_number)
);
create table public.notification_preferences(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users(id) on delete cascade,channel text not null default 'email' check(channel='email'),category public.notification_category not null,
 enabled boolean not null default true,consent_version text,updated_at timestamptz not null default now(),unique(customer_id,channel,category),
 check(category not in('transactional','operational') or enabled)
);
create table public.email_suppressions(id uuid primary key default gen_random_uuid(),email_hash text not null unique,reason text not null check(reason in('hard_bounce','complaint','invalid','manual','legal')),source text not null,provider_reference text,created_at timestamptz not null default now(),expires_at timestamptz);
create index notification_queue_idx on public.notification_events(status,scheduled_for,priority,created_at);
create index notification_deliveries_event_idx on public.notification_deliveries(notification_event_id,attempt_number desc);
create trigger notification_templates_updated before update on public.notification_templates for each row execute function app_private.set_updated_at();
create trigger notification_events_updated before update on public.notification_events for each row execute function app_private.set_updated_at();
create or replace function app_private.protect_active_notification_template() returns trigger language plpgsql set search_path='' as $$begin if old.status='active' and(new.subject_template<>old.subject_template or new.body_html_template<>old.body_html_template or new.body_text_template<>old.body_text_template or new.required_variables<>old.required_variables or new.version<>old.version) then raise exception 'active_template_immutable' using errcode='23514';end if;return new;end$$;
create trigger protect_active_notification_template before update on public.notification_templates for each row execute function app_private.protect_active_notification_template();

insert into public.app_settings(key,value,description,is_public) values
('communications.email_retry_max_attempts','4','Máximo de intentos de email',false),('communications.email_retry_base_delay_minutes','5','Base del backoff',false),
('communications.email_processing_timeout_minutes','10','Recuperación de eventos bloqueados',false),('communications.pickup_reminder_hours_before','18','Antelación del recordatorio',false),
('communications.retention_days','365','Retención técnica orientativa',false) on conflict(key) do nothing;

create or replace function app_private.enqueue_notification(p_event text,p_entity_type text,p_entity_id text,p_email text,p_recipient uuid,p_payload jsonb,p_key text,p_priority public.notification_priority default 'normal',p_scheduled timestamptz default now()) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid;begin
 if trim(coalesce(p_email,''))='' then return null;end if;
 insert into public.notification_events(event_key,entity_type,entity_id,recipient_type,recipient_id,recipient_email,payload,idempotency_key,priority,scheduled_for)
 values(p_event,p_entity_type,p_entity_id,case when p_recipient is null then 'guest' else 'customer' end,p_recipient,lower(trim(p_email)),coalesce(p_payload,'{}'),p_key,p_priority,p_scheduled)
 on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into result;return result;end$$;

create or replace function app_private.order_notification_outbox() returns trigger language plpgsql security definer set search_path='' as $$declare event text;begin
 if tg_op='UPDATE' and new.status=old.status then return new;end if;
 event:=case new.status when 'confirmed' then 'order-confirmed' when 'ready' then 'order-ready' when 'collected' then 'order-collected' when 'cancelled' then 'order-cancelled' else null end;
 if event is not null and new.payment_status='paid' then perform app_private.enqueue_notification(event,'orders',new.id::text,coalesce(new.customer_email,new.guest_email),new.customer_id,jsonb_build_object('customer_name',new.customer_name,'order_code',new.public_code,'collection_date',new.collection_date,'order_total',new.total_cents,'currency',new.currency),event||':'||new.id::text,case when event='order-ready' then 'high'::public.notification_priority else 'normal'::public.notification_priority end);end if;return new;end$$;
create trigger orders_notification_outbox after insert or update of status on public.orders for each row execute function app_private.order_notification_outbox();

create or replace function app_private.subscription_notification_outbox() returns trigger language plpgsql security definer set search_path='' as $$declare event text;email text;begin
 if tg_op='UPDATE' and new.status=old.status then return new;end if;event:=case new.status when 'active' then 'subscription-started' when 'paused' then 'subscription-paused' when 'cancelled' then 'subscription-cancelled' when 'past_due' then 'subscription-payment-failed' when 'requires_attention' then 'subscription-action-required' else null end;
 if event is not null then select u.email into email from auth.users u where u.id=new.customer_id;perform app_private.enqueue_notification(event,'subscriptions',new.id::text,email,new.customer_id,jsonb_build_object('next_collection_date',new.next_collection_date),event||':'||new.id::text||':'||new.status::text,'normal');end if;return new;end$$;
create trigger subscriptions_notification_outbox after insert or update of status on public.subscriptions for each row execute function app_private.subscription_notification_outbox();

create or replace function app_private.payment_notification_outbox() returns trigger language plpgsql security definer set search_path='' as $$declare o public.orders;event text;begin if new.processing_status<> 'processed' then return new;end if;event:=case when new.event_type='payment_intent.payment_failed' then 'payment-failed' when new.event_type='payment_intent.canceled' then 'payment-cancelled' else null end;if event is null or new.order_id is null then return new;end if;select * into o from public.orders where id=new.order_id;perform app_private.enqueue_notification(event,'orders',o.id::text,coalesce(o.customer_email,o.guest_email),o.customer_id,jsonb_build_object('customer_name',o.customer_name,'order_code',o.public_code),event||':'||o.id::text,'high');return new;end$$;
create trigger payment_notification_outbox after insert or update of processing_status on public.payment_events for each row execute function app_private.payment_notification_outbox();

create or replace function app_private.cycle_notification_outbox() returns trigger language plpgsql security definer set search_path='' as $$declare s public.subscriptions;email text;begin if new.status='order_created' and(tg_op='INSERT' or old.status<>new.status) then select * into s from public.subscriptions where id=new.subscription_id;select u.email into email from auth.users u where u.id=s.customer_id;perform app_private.enqueue_notification('subscription-cycle-confirmed','subscription_cycles',new.id::text,email,s.customer_id,jsonb_build_object('next_collection_date',new.collection_date),'subscription-cycle-confirmed:'||new.id::text,'normal');end if;return new;end$$;
create trigger cycle_notification_outbox after insert or update of status on public.subscription_cycles for each row execute function app_private.cycle_notification_outbox();

create or replace function public.claim_notification_events(p_limit integer default 20) returns setof public.notification_events language plpgsql security definer set search_path='' as $$declare timeout_minutes integer;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;select(value#>>'{}')::integer into timeout_minutes from public.app_settings where key='communications.email_processing_timeout_minutes';
 update public.notification_events set status='pending',processing_started_at=null where status='processing' and processing_started_at<now()-make_interval(mins=>coalesce(timeout_minutes,10));
 return query with picked as(select id from public.notification_events where status='pending' and scheduled_for<=now() order by case priority when 'critical' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,created_at for update skip locked limit greatest(1,least(p_limit,100))) update public.notification_events e set status='processing',processing_started_at=now(),attempt_count=attempt_count+1 from picked where e.id=picked.id returning e.*;end$$;
create or replace function public.finish_notification_event(p_event uuid,p_success boolean,p_provider text,p_message_id text,p_error_code text,p_error text) returns void language plpgsql security definer set search_path='' as $$declare e public.notification_events;max_attempts integer;base_delay integer;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;select * into e from public.notification_events where id=p_event for update;if not found then return;end if;
 insert into public.notification_deliveries(notification_event_id,provider,provider_message_id,recipient_email,status,attempt_number,error_code,error_message,sent_at) values(e.id,p_provider,p_message_id,e.recipient_email,(case when p_success then 'sent' else 'failed' end)::public.notification_delivery_status,e.attempt_count,p_error_code,left(p_error,500),case when p_success then now() end) on conflict(notification_event_id,attempt_number) do nothing;
 if p_success then update public.notification_events set status='sent',last_error=null where id=e.id;else select(value#>>'{}')::integer into max_attempts from public.app_settings where key='communications.email_retry_max_attempts';select(value#>>'{}')::integer into base_delay from public.app_settings where key='communications.email_retry_base_delay_minutes';update public.notification_events set status=case when attempt_count>=coalesce(max_attempts,4) then 'failed' else 'pending' end,scheduled_for=now()+make_interval(mins=>coalesce(base_delay,5)*greatest(1,attempt_count*attempt_count)),last_error=left(p_error,500) where id=e.id;end if;end$$;

create or replace function public.enqueue_pickup_reminders() returns integer language plpgsql security definer set search_path='' as $$declare hours integer;counted integer;begin if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;select(value#>>'{}')::integer into hours from public.app_settings where key='communications.pickup_reminder_hours_before';
 insert into public.notification_events(event_key,entity_type,entity_id,recipient_type,recipient_id,recipient_email,payload,idempotency_key,priority,scheduled_for)
 select 'pickup-reminder','orders',o.id::text,case when o.customer_id is null then 'guest' else 'customer' end,o.customer_id,coalesce(o.customer_email,o.guest_email),jsonb_build_object('customer_name',o.customer_name,'order_code',o.public_code,'collection_date',o.collection_date),'pickup-reminder:'||o.id::text||':'||o.collection_date::text,'high',now() from public.orders o where o.status in('confirmed','ready') and o.payment_status='paid' and o.collection_date between current_date and current_date+1 and coalesce(o.customer_email,o.guest_email) is not null and not exists(select 1 from public.notification_preferences p where p.customer_id=o.customer_id and p.category='reminder' and not p.enabled) on conflict(idempotency_key) do nothing;get diagnostics counted=row_count;return counted;end$$;

-- Templates transacionais: conteúdo genérico, sem dados comerciais inventados.
insert into public.notification_templates(key,name,subject_template,body_html_template,body_text_template,status,version,required_variables) values
('order-confirmed','Pedido confirmado','Tu pedido {{order_code}} está confirmado','<h1>Pedido confirmado</h1><p>Hola {{customer_name}}.</p><p>Tu pedido {{order_code}} está pagado y confirmado para {{collection_date}}.</p><p>No tienes que pagar nada en el punto.</p>','Pedido {{order_code}} confirmado para {{collection_date}}. No tienes que pagar nada en el punto.','active',1,array['customer_name','order_code','collection_date']),
('order-ready','Pedido listo','Tu pedido {{order_code}} ya está preparado','<h1>Tu pan está preparado</h1><p>Recógelo con el código {{order_code}}.</p>','Tu pedido está preparado. Código: {{order_code}}.','active',1,array['order_code']),
('order-collected','Pedido recogido','Pedido {{order_code}} recogido','<h1>Pedido recogido</h1><p>Hemos marcado {{order_code}} como recogido.</p>','Pedido {{order_code}} recogido.','active',1,array['order_code']),
('order-cancelled','Pedido cancelado','Pedido {{order_code}} cancelado','<h1>Pedido cancelado</h1><p>El pedido {{order_code}} ha sido cancelado.</p>','Pedido {{order_code}} cancelado.','active',1,array['order_code']),
('payment-failed','Pago no completado','No se pudo completar el pago','<h1>Pago no completado</h1><p>Tu pedido no ha quedado confirmado.</p>','No se pudo completar el pago. El pedido no está confirmado.','active',1,'{}'),
('pickup-reminder','Recordatorio de recogida','Recuerda recoger tu pedido {{order_code}}','<h1>Tu recogida se acerca</h1><p>Recuerda tu pedido {{order_code}} para {{collection_date}}.</p>','Recuerda recoger {{order_code}} el {{collection_date}}.','active',1,array['order_code','collection_date']);
insert into public.notification_templates(key,name,subject_template,body_html_template,body_text_template,status,version,required_variables) values
('payment-cancelled','Pago cancelado','El pago se ha cancelado','<h1>Pago cancelado</h1><p>El pedido no ha quedado confirmado.</p>','El pago se ha cancelado y el pedido no está confirmado.','active',1,'{}'),
('subscription-started','Plan de Pan activo','Tu Plan de Pan está activo','<h1>Plan de Pan activo</h1><p>Tu subscripción ya está en marcha.</p>','Tu Plan de Pan ya está activo.','active',1,'{}'),
('subscription-paused','Plan de Pan pausado','Tu Plan de Pan está pausado','<h1>Plan de Pan pausado</h1><p>La pausa ha quedado registrada.</p>','Tu Plan de Pan está pausado.','active',1,'{}'),
('subscription-resumed','Plan de Pan reanudado','Tu Plan de Pan vuelve a estar activo','<h1>Plan de Pan reanudado</h1><p>Volvemos a reservar tus próximos ciclos.</p>','Tu Plan de Pan se ha reanudado.','active',1,'{}'),
('subscription-cancelled','Plan de Pan cancelado','Tu Plan de Pan está cancelado','<h1>Plan de Pan cancelado</h1><p>Conservamos el historial de los ciclos anteriores.</p>','Tu Plan de Pan se ha cancelado.','active',1,'{}'),
('subscription-payment-failed','Cobro pendiente','No se pudo completar el cobro del Plan de Pan','<h1>No se pudo completar el cobro</h1><p>Revisa el método de pago desde tu cuenta.</p>','No se pudo completar el cobro del Plan de Pan.','active',1,'{}'),
('subscription-action-required','Acción necesaria','Tu Plan de Pan necesita una acción','<h1>Necesitamos que revises tu Plan de Pan</h1><p>Entra en tu cuenta para continuar.</p>','Tu Plan de Pan necesita una acción desde tu cuenta.','active',1,'{}'),
('subscription-cycle-confirmed','Próxima recogida confirmada','Tu próxima recogida está confirmada','<h1>Recogida confirmada</h1><p>La próxima recogida será el {{next_collection_date}}.</p>','Próxima recogida: {{next_collection_date}}.','active',1,array['next_collection_date']),
('subscription-changed','Plan de Pan actualizado','Hemos actualizado tu Plan de Pan','<h1>Plan actualizado</h1><p>El cambio se aplicará según lo indicado en tu cuenta.</p>','Tu Plan de Pan se ha actualizado.','active',1,'{}'),
('pickup-window-changed','Horario de recogida actualizado','Ha cambiado la ventana de recogida','<h1>Cambio de horario</h1><p>Consulta en tu pedido la nueva ventana de recogida.</p>','Ha cambiado la ventana de recogida. Consulta tu pedido.','active',1,'{}');

alter table public.notification_templates enable row level security;alter table public.notification_events enable row level security;alter table public.notification_deliveries enable row level security;alter table public.notification_preferences enable row level security;alter table public.email_suppressions enable row level security;
create policy templates_admin_read on public.notification_templates for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin'));
create policy templates_admin_manage on public.notification_templates for all to authenticated using(app_private.has_role('owner') or app_private.has_role('admin')) with check(app_private.has_role('owner') or app_private.has_role('admin'));
create policy events_staff_read on public.notification_events for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin') or app_private.has_role('operator'));
create policy deliveries_admin_read on public.notification_deliveries for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin'));
create policy preferences_own on public.notification_preferences for select to authenticated using(customer_id=auth.uid() or app_private.has_role('owner') or app_private.has_role('admin'));
create policy preferences_own_insert on public.notification_preferences for insert to authenticated with check(customer_id=auth.uid() and category in('subscription','reminder','marketing'));
create policy preferences_own_update on public.notification_preferences for update to authenticated using(customer_id=auth.uid() and category in('subscription','reminder','marketing')) with check(customer_id=auth.uid() and category in('subscription','reminder','marketing'));
create policy suppressions_admin on public.email_suppressions for select to authenticated using(app_private.has_role('owner') or app_private.has_role('admin'));
grant select,insert,update on public.notification_templates to authenticated;grant select on public.notification_events,public.notification_deliveries,public.email_suppressions to authenticated;grant select,insert,update on public.notification_preferences to authenticated;
revoke all on function public.claim_notification_events(integer),public.finish_notification_event(uuid,boolean,text,text,text,text),public.enqueue_pickup_reminders() from public;
grant execute on function public.claim_notification_events(integer),public.finish_notification_event(uuid,boolean,text,text,text,text),public.enqueue_pickup_reminders() to service_role;
