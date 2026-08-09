-- Precios PROVISIONALES para poder ver y probar el catálogo real funcionando
-- (Documento funcional del cliente §3 no trae precios). A pedido explícito del
-- usuario ('Publicar con precios provisórios'), NO son precios reales del
-- obrador -- hay que sustituirlos por los definitivos antes de publicitar el
-- sitio. Se marcan las variantes y productos como 'active' porque
-- validate_product_publication() exige precio antes de permitirlo.
--
-- validate_product_publication() también exige short_description no vacía;
-- 24 de los 26 productos reales se sembraron sin ella (solo se completó para
-- los productos congelados/envasados). Se rellena aquí con una frase breve
-- descriptiva por producto, también editable luego desde /admin/productos.

update public.products set short_description = case slug
  when 'rustico-fuerza' then 'Pan rústico de fermentación lenta, de martes a sábado.'
  when 'chapata' then 'Chapata de corteza crujiente y miga alveolada.'
  when 'semillas-fuerza' then 'Pan de masa madre con mezcla de semillas.'
  when 'integral' then 'Pan 100% integral de fermentación lenta.'
  when 'pan-de-maiz' then 'Especial de los martes: pan con harina de maíz.'
  when 'pan-de-sarraceno' then 'Especial de los miércoles: pan de harina de trigo sarraceno.'
  when 'centeno-100' then 'Especial de los jueves: pan 100% de centeno.'
  when 'centeno-con-semillas' then 'Especial de los jueves: pan de centeno con semillas.'
  when 'oroel' then 'Especial de los viernes: pan de trigo Oroel.'
  when 'escanda' then 'Especial de los viernes: pan de escanda asturiana.'
  when 'empanadas' then 'Empanadas artesanales horneadas, en bonito o carne.'
  when 'pan-de-molde-artesanal' then 'Pan de molde artesanal para el día a día.'
  when 'crackers' then 'Crackers artesanales de masa madre.'
  when 'prenaos-de-maiz' then 'Preñaos de maíz rellenos, horneados en el obrador.'
  when 'bases-de-pizza' then 'Bases de pizza de masa madre, listas para hornear en casa.'
  when 'cookies-de-chocolate' then 'Cookies artesanales con chocolate.'
  when 'cookies-de-sarraceno-y-limon' then 'Cookies de trigo sarraceno con un toque de limón.'
  when 'magdalenas-de-sarraceno' then 'Magdalenas esponjosas de harina de sarraceno.'
  when 'granola' then 'Granola artesanal horneada en el obrador.'
  when 'bizcocho-de-maiz' then 'Bizcocho tradicional de harina de maíz.'
  when 'rollos-de-canela' then 'Rollos de canela recién horneados.'
  when 'pan-de-guayaba-y-queso' then 'Pan relleno de guayaba y queso, congelado y listo para hornear en casa.'
  when 'pan-de-molde-con-queso' then 'Pan de molde con queso, congelado y listo para hornear.'
  when 'mojicones-pan-pinita' then 'Mojicones (Pan Piñita), horneados en el obrador.'
  else short_description end
where short_description is null;

update public.product_variants set price_cents = case id
  when 'e58c46a2-0613-4aaa-bdcd-e42be9c09ee6' then 480
  when '1f191471-1c5f-4e51-9fb0-01315e5664b4' then 350
  when '663cfe5b-5efa-4fb3-88b3-892f0c228f30' then 520
  when '551ecce0-2e87-47f0-8694-caf1268bb8ab' then 450
  when 'ff918441-8160-48b5-97ea-60a32cf4eca4' then 480
  when '7285cbf7-ce00-4850-a5b0-2b5bfba25428' then 550
  when 'e6a2a1fb-3d59-4db0-beaf-8d2a07354903' then 500
  when '6d359d81-23ed-4b8e-8b7a-9fbf6c7fb75e' then 550
  when '05a742ab-5cd2-4b2b-b2f7-5c5a5abcfb82' then 580
  when 'e3e7f123-28ae-49df-91c7-d82a7e804aba' then 580
  when '46a337a9-0cc1-4b05-8d05-e13ef679b67c' then 350
  when '1115f3d6-5dfc-4ad7-b604-f28af35ba76f' then 350
  when '7b1a33d7-ed2c-4282-9abd-9440510522f9' then 450
  when '17115ac9-10ae-4ad2-b325-fce48b953e6b' then 400
  when 'de32f0e1-b1ee-4f80-96b4-5ed2603e1c32' then 300
  when 'a5bd8c54-3446-4215-afb2-77cdc2d0a260' then 350
  when '33bbcae1-0dba-4667-811f-ef6426b02cb4' then 250
  when '02415d8e-457f-44bf-a9e9-e78f07041e45' then 280
  when 'b28bd811-1baa-4472-ba61-87e4195feaf5' then 300
  when 'b580a8d8-eebd-4298-a587-4f9da3b90575' then 600
  when '075dda57-2f4e-4444-a6ea-aa798e0863b1' then 450
  when '5cbed732-a80e-4774-ae05-85bfa1a78a09' then 320
  when '7f0b9f70-ce33-4a3a-93ad-44cd24cea350' then 550
  when '410bc061-317e-4719-8f12-43098939b0f3' then 550
  when '8fb8f6a9-1e00-42d2-9d90-dc0b762c01f0' then 400
  when 'dede7b19-68f2-4766-8ff2-afa03f0d92b8' then 800
  when 'aed6851b-b468-4f25-95ba-beebe6076766' then 700
  else price_cents end, status = 'active'
where id in ('e58c46a2-0613-4aaa-bdcd-e42be9c09ee6'::uuid, '1f191471-1c5f-4e51-9fb0-01315e5664b4'::uuid, '663cfe5b-5efa-4fb3-88b3-892f0c228f30'::uuid, '551ecce0-2e87-47f0-8694-caf1268bb8ab'::uuid, 'ff918441-8160-48b5-97ea-60a32cf4eca4'::uuid, '7285cbf7-ce00-4850-a5b0-2b5bfba25428'::uuid, 'e6a2a1fb-3d59-4db0-beaf-8d2a07354903'::uuid, '6d359d81-23ed-4b8e-8b7a-9fbf6c7fb75e'::uuid, '05a742ab-5cd2-4b2b-b2f7-5c5a5abcfb82'::uuid, 'e3e7f123-28ae-49df-91c7-d82a7e804aba'::uuid, '46a337a9-0cc1-4b05-8d05-e13ef679b67c'::uuid, '1115f3d6-5dfc-4ad7-b604-f28af35ba76f'::uuid, '7b1a33d7-ed2c-4282-9abd-9440510522f9'::uuid, '17115ac9-10ae-4ad2-b325-fce48b953e6b'::uuid, 'de32f0e1-b1ee-4f80-96b4-5ed2603e1c32'::uuid, 'a5bd8c54-3446-4215-afb2-77cdc2d0a260'::uuid, '33bbcae1-0dba-4667-811f-ef6426b02cb4'::uuid, '02415d8e-457f-44bf-a9e9-e78f07041e45'::uuid, 'b28bd811-1baa-4472-ba61-87e4195feaf5'::uuid, 'b580a8d8-eebd-4298-a587-4f9da3b90575'::uuid, '075dda57-2f4e-4444-a6ea-aa798e0863b1'::uuid, '5cbed732-a80e-4774-ae05-85bfa1a78a09'::uuid, '7f0b9f70-ce33-4a3a-93ad-44cd24cea350'::uuid, '410bc061-317e-4719-8f12-43098939b0f3'::uuid, '8fb8f6a9-1e00-42d2-9d90-dc0b762c01f0'::uuid, 'dede7b19-68f2-4766-8ff2-afa03f0d92b8'::uuid, 'aed6851b-b468-4f25-95ba-beebe6076766'::uuid);

update public.products set status = 'active' where id in (select product_id from public.product_variants where id in (
'e58c46a2-0613-4aaa-bdcd-e42be9c09ee6'::uuid, '1f191471-1c5f-4e51-9fb0-01315e5664b4'::uuid, '663cfe5b-5efa-4fb3-88b3-892f0c228f30'::uuid, '551ecce0-2e87-47f0-8694-caf1268bb8ab'::uuid, 'ff918441-8160-48b5-97ea-60a32cf4eca4'::uuid, '7285cbf7-ce00-4850-a5b0-2b5bfba25428'::uuid, 'e6a2a1fb-3d59-4db0-beaf-8d2a07354903'::uuid, '6d359d81-23ed-4b8e-8b7a-9fbf6c7fb75e'::uuid, '05a742ab-5cd2-4b2b-b2f7-5c5a5abcfb82'::uuid, 'e3e7f123-28ae-49df-91c7-d82a7e804aba'::uuid, '46a337a9-0cc1-4b05-8d05-e13ef679b67c'::uuid, '1115f3d6-5dfc-4ad7-b604-f28af35ba76f'::uuid, '7b1a33d7-ed2c-4282-9abd-9440510522f9'::uuid, '17115ac9-10ae-4ad2-b325-fce48b953e6b'::uuid, 'de32f0e1-b1ee-4f80-96b4-5ed2603e1c32'::uuid, 'a5bd8c54-3446-4215-afb2-77cdc2d0a260'::uuid, '33bbcae1-0dba-4667-811f-ef6426b02cb4'::uuid, '02415d8e-457f-44bf-a9e9-e78f07041e45'::uuid, 'b28bd811-1baa-4472-ba61-87e4195feaf5'::uuid, 'b580a8d8-eebd-4298-a587-4f9da3b90575'::uuid, '075dda57-2f4e-4444-a6ea-aa798e0863b1'::uuid, '5cbed732-a80e-4774-ae05-85bfa1a78a09'::uuid, '7f0b9f70-ce33-4a3a-93ad-44cd24cea350'::uuid, '410bc061-317e-4719-8f12-43098939b0f3'::uuid, '8fb8f6a9-1e00-42d2-9d90-dc0b762c01f0'::uuid, 'dede7b19-68f2-4766-8ff2-afa03f0d92b8'::uuid, 'aed6851b-b468-4f25-95ba-beebe6076766'::uuid
));
