-- Catálogo real de FUERZA, tal como lo describe el Documento funcional del
-- cliente (docs/FUERZA_Manual_Proyecto_Web_v3.docx, sección 3). No es dato de
-- prueba: es el menú real proporcionado por el cliente, así que a diferencia
-- de seed.sql (intencionalmente vacío para datos ficticios) esta migración sí
-- lo inserta.
--
-- El documento no incluye precios. Todos los productos quedan en 'draft'
-- (no publicados) con una variante sin price_cents: el trigger de
-- publicación (validate_product_publication) ya exige un precio antes de
-- poder pasar a 'active', así que no hay riesgo de publicar algo sin tarifa.
-- El IVA se ha fijado según la ley española (4% superreducido para pan común,
-- 10% reducido para el resto de alimentación) -- a confirmar por el obrador,
-- no es un valor que venga del documento.
--
-- El "Especial de la semana" del sábado (sección 4) no se siembra aquí: es
-- un producto rotativo por diseño, todavía sin la funcionalidad de curación
-- semanal (pendiente, ver informe de brecha).

do $$
declare
  v_fam_diarios uuid;
  v_fam_especial_dia uuid;
  v_fam_salados uuid;
  v_fam_dulces uuid;
  v_fam_especiales uuid;
  v_product_id uuid;
begin
  insert into public.product_families (name, slug, description, color_key, display_order, status)
  values ('Panes diarios', 'panes-diarios', 'De martes a sábado, todos los días.', 'terracota', 0, 'active')
  returning id into v_fam_diarios;
  insert into public.product_families (name, slug, description, color_key, display_order, status)
  values ('Pan especial del día', 'pan-especial-del-dia', 'Un pan distinto cada día de la semana.', 'amarillo', 1, 'active')
  returning id into v_fam_especial_dia;
  insert into public.product_families (name, slug, description, color_key, display_order, status)
  values ('Salados', 'salados', 'Empanadas, bases y horneados salados.', 'verde', 2, 'active')
  returning id into v_fam_salados;
  insert into public.product_families (name, slug, description, color_key, display_order, status)
  values ('Dulces', 'dulces', 'Bollería, galletas y repostería del obrador.', 'azul', 3, 'active')
  returning id into v_fam_dulces;
  insert into public.product_families (name, slug, description, color_key, display_order, status)
  values ('Especiales', 'especiales', 'Producto de fermentación larga y congelados listos para hornear.', 'negro', 4, 'active')
  returning id into v_fam_especiales;

  -- === Panes diarios (martes a sábado: 2,3,4,5,6) ===================

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_diarios, 'Rústico Fuerza', 'rustico-fuerza', 'draft', 0) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_diarios, 'Chapata', 'chapata', 'draft', 1) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_diarios, 'Semillas Fuerza', 'semillas-fuerza', 'draft', 2) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_diarios, 'Integral', 'integral', 'Integral', 'draft', 3) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  -- === Pan especial del día (un día concreto cada uno) ===============

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_especial_dia, 'Pan de maíz', 'pan-de-maiz', 'draft', 0) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 2, true);

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_especial_dia, 'Pan de sarraceno', 'pan-de-sarraceno', 'Sarraceno', 'draft', 1) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 3, true);

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_especial_dia, 'Centeno 100%', 'centeno-100', 'Centeno', 'draft', 2) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 4, true);

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_especial_dia, 'Centeno con semillas', 'centeno-con-semillas', 'Centeno', 'draft', 3) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 4, true);

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_especial_dia, 'Oroel', 'oroel', 'draft', 4) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 5, true);

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_especial_dia, 'Escanda', 'escanda', 'Escanda', 'draft', 5) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 4, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) values (v_product_id, 5, true);

  -- === Salados (martes a sábado por defecto; el documento no especifica días) ===

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_salados, 'Empanadas', 'empanadas', 'draft', 0) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Bonito', 10, 'draft', 0), (v_product_id, 'Carne', 10, 'draft', 1);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_salados, 'Pan de molde artesanal', 'pan-de-molde-artesanal', 'draft', 1) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_salados, 'Crackers', 'crackers', 'draft', 2) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_salados, 'Preñaos de maíz', 'prenaos-de-maiz', 'draft', 3) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_salados, 'Bases de pizza', 'bases-de-pizza', 'draft', 4) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  -- === Dulces (martes a sábado por defecto) ==========================

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_dulces, 'Cookies de chocolate', 'cookies-de-chocolate', 'draft', 0) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_dulces, 'Cookies de sarraceno y limón', 'cookies-de-sarraceno-y-limon', 'Sarraceno', 'draft', 1) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, flour_type, status, display_order)
  values (v_fam_dulces, 'Magdalenas de sarraceno', 'magdalenas-de-sarraceno', 'Sarraceno', 'draft', 2) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_dulces, 'Granola', 'granola', 'draft', 3) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_dulces, 'Bizcocho de maíz', 'bizcocho-de-maiz', 'draft', 4) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_dulces, 'Rollos de canela', 'rollos-de-canela', 'draft', 5) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order) values (v_product_id, 'Única', 10, 'draft', 0);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  -- === Especiales (congelados/envasados: con seguimiento de estoque) ==

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_especiales, 'Pan de guayaba y queso', 'pan-de-guayaba-y-queso', 'draft', 0) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order, stock_tracking) values (v_product_id, 'Única', 10, 'draft', 0, true);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_especiales, 'Pan de molde con queso', 'pan-de-molde-con-queso', 'draft', 1) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order, stock_tracking) values (v_product_id, 'Única', 10, 'draft', 0, true);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, status, display_order)
  values (v_fam_especiales, 'Mojicones (Pan Piñita)', 'mojicones-pan-pinita', 'draft', 2) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order, stock_tracking) values (v_product_id, 'Única', 10, 'draft', 0, true);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, short_description, status, display_order)
  values (v_fam_especiales, 'Empanadas colombianas congeladas', 'empanadas-colombianas-congeladas', 'Congeladas, listas para hornear o freír en casa.', 'draft', 3) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order, stock_tracking) values (v_product_id, 'Única', 10, 'draft', 0, true);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

  insert into public.products (family_id, name, slug, short_description, status, display_order)
  values (v_fam_especiales, 'Coxinhas congeladas', 'coxinhas-congeladas', 'Congeladas, listas para hornear o freír en casa.', 'draft', 4) returning id into v_product_id;
  insert into public.product_variants (product_id, name, vat_rate, status, display_order, stock_tracking) values (v_product_id, 'Única', 10, 'draft', 0, true);
  insert into public.product_production_weekdays (product_id, weekday, is_active) select v_product_id, w, true from unnest(array[2,3,4,5,6]) w;

end $$;
