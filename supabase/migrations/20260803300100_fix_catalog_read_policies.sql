-- Mismo defecto que en 20260803300000: las políticas comparaban el id de la
-- fila (allergens.id / ingredients.id) sin cualificar contra el `products p`
-- unido en el EXISTS, y como `products` sí tiene una columna `id`, Postgres
-- resolvía la referencia contra `p.id` en vez de contra la tabla exterior.
-- El resultado: ningún alérgeno ni ingrediente ha sido nunca visible para el
-- público (product_allergens/product_ingredients sí lo eran, por eso el
-- error no era evidente: el enlace existía, pero el nombre nunca se podía
-- leer).
drop policy if exists allergens_public_read on public.allergens;
create policy allergens_public_read on public.allergens for select to anon, authenticated using (
  exists (
    select 1 from public.product_allergens pa
    join public.products p on p.id = pa.product_id
    where pa.allergen_id = allergens.id
      and p.status in ('active', 'seasonal')
  )
);

drop policy if exists ingredients_public_read on public.ingredients;
create policy ingredients_public_read on public.ingredients for select to anon, authenticated using (
  exists (
    select 1 from public.product_ingredients pi
    join public.products p on p.id = pi.product_id
    where pi.ingredient_id = ingredients.id
      and p.status in ('active', 'seasonal')
  )
);
