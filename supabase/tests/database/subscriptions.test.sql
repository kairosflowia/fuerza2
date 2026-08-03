begin;
select plan(18);

select has_table('public','subscription_plans','plans table exists');
select has_table('public','subscription_plan_items','plan items table exists');
select has_table('public','subscriptions','subscriptions table exists');
select has_table('public','subscription_items','contract snapshots exist');
select has_table('public','subscription_cycles','cycles table exists');
select has_table('public','subscription_status_history','immutable status history exists');
select has_table('public','subscription_change_requests','controlled changes exist');
select col_type_is('public','subscription_plans','price_cents','integer','plan price uses integer cents');
select col_is_unique('public','subscription_cycles','stripe_invoice_id','one cycle per Stripe invoice');
select col_is_unique('public','subscriptions','stripe_subscription_id','Stripe subscription cannot duplicate');
select col_is_unique('public','orders','subscription_cycle_id','one order per cycle');
select ok((select relrowsecurity from pg_class where oid='public.subscriptions'::regclass),'subscriptions use RLS');
select ok((select relrowsecurity from pg_class where oid='public.subscription_plans'::regclass),'plans use RLS');
select has_function('public','create_subscription_candidate',array['uuid','uuid','integer','uuid'],'capacity-safe candidate function exists');
select has_function('public','process_subscription_invoice',array['text','text','text','text','integer','text','text'],'idempotent invoice processor exists');
select has_function('public','run_subscription_jobs',array[]::text[],'subscription reconciliation job exists');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok($$select * from public.process_subscription_invoice('evt','in','sub','pi',100,'eur','hash')$$,'42501',null,'clients cannot process invoices');
select throws_ok($$select public.run_subscription_jobs()$$,'42501',null,'clients cannot execute jobs');

select * from finish();
rollback;
