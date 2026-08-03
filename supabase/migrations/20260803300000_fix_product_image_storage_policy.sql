-- La política original referenciaba `name` sin cualificar dentro del EXISTS
-- contra `products p`, que también tiene una columna `name` (el nombre del
-- producto). Postgres resuelve el nombre ambiguo contra el `FROM` más
-- interno, así que `storage.foldername(name)` leía en realidad
-- `products.name` (p. ej. 'Croissant') en vez de la ruta del objeto en
-- `storage.objects.name`. El resultado: ningún cliente público ha podido
-- ver nunca una imagen de producto, porque el cast a uuid del nombre del
-- producto no encaja con ningún id real.
drop policy if exists product_storage_public_read on storage.objects;
create policy product_storage_public_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'product-images'
  and name ~ '^[0-9a-f-]{36}/'
  and exists (
    select 1 from public.products p
    where p.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and p.status in ('active', 'seasonal')
  )
);
