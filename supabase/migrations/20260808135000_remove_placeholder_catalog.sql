-- Removes the pre-existing placeholder/demo catalog (created via manual admin-UI
-- testing before the real client catalog was available) so it can be replaced by
-- the real catalog seeded in 20260808140000_real_product_catalog.sql.
--
-- Verified safe before writing this migration:
--   - order_items: empty (no live orders reference these variants)
--   - stock_reservations, production_batches, production_dates: empty
--   - subscription_items: empty
--   - subscription_plan_items: 2 rows, both belonging to the single draft
--     subscription plan "Plan Semanal: Hogaza y Desayuno" (built on top of this
--     same placeholder catalog) — no live `subscriptions` reference that plan.
--
-- Deletion order: draft subscription plan first (cascades its plan_items and
-- releases the restrict-FK on product_variants), then products (cascades
-- variants/images/allergens/etc.), then the now-empty families.

delete from public.subscription_plans
where id = 'fa2b71ff-5779-4c58-b0f4-8e75debfbbf1';

delete from public.products
where family_id in (
  select id from public.product_families
  where slug in ('hogazas-artesanas', 'pasteleria', 'bolleria', 'salados', 'envasados')
);

delete from public.product_families
where slug in ('hogazas-artesanas', 'pasteleria', 'bolleria', 'salados', 'envasados');
