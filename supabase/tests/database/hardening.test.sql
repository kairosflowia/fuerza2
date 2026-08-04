begin;select plan(18);
select has_table('public','rate_limit_buckets','rate limits persistent');select has_function('public','consume_rate_limit',array['text','text','integer','integer'],'rate limiter');
select ok((select relrowsecurity from pg_class where oid='public.rate_limit_buckets'::regclass),'rate limits RLS');select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='rate_limit_buckets' and grantee in('anon','authenticated')),0,'clients cannot read limiter keys');
select has_table('public','system_integrity_alerts','integrity alerts');select has_function('public','run_integrity_audit',array[]::text[],'reconciliation job');
select ok(position($needle$SET search_path TO ''$needle$ in pg_get_functiondef('public.consume_rate_limit(text,text,integer,integer)'::regprocedure))>0,'rate limiter safe search path');
select ok(position($needle$SET search_path TO ''$needle$ in pg_get_functiondef('public.run_integrity_audit()'::regprocedure))>0,'audit safe search path');
select ok(position('service_role_required' in pg_get_functiondef('public.run_integrity_audit()'::regprocedure))>0,'audit service role only');
select ok((select count(*) from pg_policies where tablename='system_integrity_alerts' and policyname='integrity_alerts_admin_read')=1,'alert policy');
select is((select count(*)::integer from public.app_settings where key like 'legal.%'),5,'legal placeholders configured');
select ok(position('stripe_' in pg_get_functiondef('public.run_integrity_audit()'::regprocedure))=0,'alerts expose no Stripe identifiers');
select ok(position('customer_email' in pg_get_functiondef('public.run_integrity_audit()'::regprocedure))=0,'alerts expose no email');
select ok(position('customer_phone' in pg_get_functiondef('public.run_integrity_audit()'::regprocedure))=0,'alerts expose no phone');

-- Regresión: 20260803310000_harden_default_table_grants corrigió que casi
-- todas las tablas creadas desde la Fase 7 conservaban el privilegio
-- completo por defecto de la plataforma para anon/authenticated (TRUNCATE,
-- REFERENCES, TRIGGER, y en muchos casos INSERT/UPDATE/DELETE sin ninguna
-- política que los respaldara). Estas comprobaciones son deliberadamente
-- genéricas (no listan tablas una a una) para que cualquier tabla futura que
-- vuelva a heredar el grant por defecto sin revocarlo haga fallar el test.
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and grantee in('anon','authenticated') and privilege_type='TRUNCATE'),0,'no client role ever needs TRUNCATE on any public table');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and grantee in('anon','authenticated') and privilege_type in('REFERENCES','TRIGGER')),0,'no client role ever needs REFERENCES/TRIGGER (schema-design privileges) on any public table');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name in('orders','order_items','order_status_history','order_fulfillment_items','payment_events','stock_reservations','subscriptions','subscription_items','subscription_cycles','subscription_status_history','subscription_change_requests','system_integrity_alerts') and grantee='anon'),0,'anon has zero grants of any kind on money/reservation/audit tables');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name in('orders','order_items','order_status_history','payment_events','stock_reservations','subscriptions','subscription_items','subscription_cycles','subscription_status_history') and grantee='authenticated' and privilege_type in('INSERT','UPDATE','DELETE')),0,'authenticated cannot write money/reservation tables directly; only through SECURITY DEFINER functions');
select * from finish();rollback;
