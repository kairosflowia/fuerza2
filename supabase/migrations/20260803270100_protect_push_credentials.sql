-- Device secrets are server-only. Customers and administrators use the metadata view and RPCs.
revoke select, insert, update, delete on public.push_subscriptions from authenticated;
grant select on public.push_subscription_metadata to authenticated;
