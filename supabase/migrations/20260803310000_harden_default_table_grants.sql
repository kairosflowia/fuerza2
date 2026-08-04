-- Auditoría de seguridad: casi todas las tablas creadas a partir de la Fase 7
-- (checkout, suscripciones, producción, comunicaciones, push, analítica) nunca
-- recibieron el `revoke all ... from anon, authenticated` inicial que sí se
-- aplicó en la Fase 4 (catálogo) y en la Fase 5 (puntos de recogida). Heredan
-- por tanto el privilegio completo por defecto de la plataforma (SELECT,
-- INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) para anon Y
-- authenticated en cada tabla nueva.
--
-- Verificado empíricamente antes de escribir esta migración: con una cuenta de
-- cliente real autenticada, intentar marcar un pedido propio como pagado
-- directamente (UPDATE orders SET status='confirmed', payment_status='paid')
-- devuelve 0 filas afectadas — RLS bloquea hoy toda escritura real porque no
-- existe ninguna política que la permita para esos roles en esas tablas. No es
-- una vulnerabilidad activa hoy, pero es un fallo grave de defensa en
-- profundidad: un futuro bug de política demasiado permisiva (ya ha ocurrido
-- dos veces en este proyecto, ver 20260803300000 y 20260803300100) sería
-- explotable de inmediato sin este remiendo, sin necesidad de tocar ningún grant.
--
-- Regla aplicada por tabla: primero revoke all, después se devuelve
-- exactamente lo que ya usa una política RLS real para ese rol (ni más ni
-- menos), con tres excepciones documentadas donde el acceso real no pasa por
-- políticas RLS sino por una vista security_invoker=false o por un grant
-- explícito ya endurecido en una migración posterior:
--  · pickup_points_public y las otras 4 vistas *_public: vistas
--    security_invoker=false, sin RLS propia; su único control de acceso es
--    el grant. Mantienen select para anon y authenticated.
--  · push_subscription_metadata: misma naturaleza (vista sin invoker),
--    mantiene select solo para authenticated (nunca anon).
--  · push_subscriptions: 20260803270100_protect_push_credentials.sql ya
--    revocó deliberadamente el acceso directo de authenticated (las claves
--    de dispositivo son sensibles); las políticas push_own_* siguen ahí como
--    respaldo pero no se les devuelve ningún grant.

revoke all on public.availability_overrides from anon, authenticated;
grant select, insert, update, delete on public.availability_overrides to authenticated;

revoke all on public.email_suppressions from anon, authenticated;
grant select on public.email_suppressions to authenticated;

revoke all on public.global_closures from anon, authenticated;
grant select, insert, update, delete on public.global_closures to authenticated;

revoke all on public.global_closures_public from anon, authenticated;
grant select on public.global_closures_public to anon;
grant select on public.global_closures_public to authenticated;

revoke all on public.notification_deliveries from anon, authenticated;
grant select on public.notification_deliveries to authenticated;

revoke all on public.notification_events from anon, authenticated;
grant select on public.notification_events to authenticated;

revoke all on public.notification_preferences from anon, authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

revoke all on public.notification_templates from anon, authenticated;
grant select, insert, update, delete on public.notification_templates to authenticated;

revoke all on public.order_fulfillment_items from anon, authenticated;
grant select on public.order_fulfillment_items to authenticated;

revoke all on public.order_items from anon, authenticated;
grant select on public.order_items to authenticated;

revoke all on public.order_status_history from anon, authenticated;
grant select on public.order_status_history to authenticated;

revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;

revoke all on public.payment_events from anon, authenticated;
grant select on public.payment_events to authenticated;

revoke all on public.pickup_point_capacity_defaults from anon, authenticated;
grant select, insert, update, delete on public.pickup_point_capacity_defaults to authenticated;

revoke all on public.pickup_point_collection_windows from anon, authenticated;
grant select, insert, update, delete on public.pickup_point_collection_windows to authenticated;

revoke all on public.pickup_point_collection_windows_public from anon, authenticated;
grant select on public.pickup_point_collection_windows_public to anon;
grant select on public.pickup_point_collection_windows_public to authenticated;

revoke all on public.pickup_point_exceptions from anon, authenticated;
grant select, insert, update, delete on public.pickup_point_exceptions to authenticated;

revoke all on public.pickup_point_exceptions_public from anon, authenticated;
grant select on public.pickup_point_exceptions_public to anon;
grant select on public.pickup_point_exceptions_public to authenticated;

revoke all on public.pickup_point_opening_hours from anon, authenticated;
grant select, insert, update, delete on public.pickup_point_opening_hours to authenticated;

revoke all on public.pickup_point_opening_hours_public from anon, authenticated;
grant select on public.pickup_point_opening_hours_public to anon;
grant select on public.pickup_point_opening_hours_public to authenticated;

revoke all on public.pickup_points_public from anon, authenticated;
grant select on public.pickup_points_public to anon;
grant select on public.pickup_points_public to authenticated;

revoke all on public.production_batch_allocations from anon, authenticated;
grant select on public.production_batch_allocations to authenticated;

revoke all on public.production_batches from anon, authenticated;
grant select on public.production_batches to authenticated;

revoke all on public.production_dates from anon, authenticated;
grant select, insert, update, delete on public.production_dates to authenticated;

revoke all on public.production_incidents from anon, authenticated;
grant select, insert, update, delete on public.production_incidents to authenticated;

revoke all on public.push_subscription_metadata from anon, authenticated;
grant select on public.push_subscription_metadata to authenticated;

revoke all on public.push_subscriptions from anon, authenticated;

revoke all on public.stock_reservations from anon, authenticated;
grant select on public.stock_reservations to authenticated;

revoke all on public.subscription_capacity_allocations from anon, authenticated;
grant select, insert, update, delete on public.subscription_capacity_allocations to authenticated;

revoke all on public.subscription_change_requests from anon, authenticated;
grant select on public.subscription_change_requests to authenticated;

revoke all on public.subscription_cycles from anon, authenticated;
grant select on public.subscription_cycles to authenticated;

revoke all on public.subscription_items from anon, authenticated;
grant select on public.subscription_items to authenticated;

revoke all on public.subscription_plan_items from anon, authenticated;
grant select on public.subscription_plan_items to anon;
grant select, insert, update, delete on public.subscription_plan_items to authenticated;

revoke all on public.subscription_plans from anon, authenticated;
grant select on public.subscription_plans to anon;
grant select, insert, update, delete on public.subscription_plans to authenticated;

revoke all on public.subscription_status_history from anon, authenticated;
grant select on public.subscription_status_history to authenticated;

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

revoke all on public.system_integrity_alerts from anon, authenticated;
grant select on public.system_integrity_alerts to authenticated;

-- Nota: storage.objects y storage.buckets tienen el mismo exceso de
-- privilegios por defecto, pero un revoke sobre el esquema storage
-- (gestionado por la extensión de Storage de Supabase) se deshace solo en
-- cada reinicio/despliegue, tanto local como en remoto: la plataforma vuelve
-- a aplicar sus grants por defecto sobre sus propios esquemas después de las
-- migraciones de usuario. No es corregible desde una migración de este
-- repositorio. Queda mitigado igual por RLS (product_storage_public_read,
-- corregida en 20260803300000): confirmado que storage.objects tiene RLS
-- activa y sin políticas de escritura para anon/authenticated.
