-- Documento funcional del cliente, sección 2: "Recogida de pedidos:
-- 10:00–14:30". La ventana de recogida del obrador principal se había
-- configurado (en una fase muy anterior, antes de leer el documento
-- funcional) como 10:00–18:00 -- coincide con el horario general del
-- establecimiento (pickup_point_opening_hours, que se deja sin tocar: el
-- documento no dice que el obrador cierre a las 14:30, solo que la
-- RECOGIDA de pedidos termina ahí), pero no con la ventana de recogida real
-- que el cliente especificó. Detectado porque /donde-estamos, que sí lee
-- estos datos en vivo, seguía mostrando 10:00–18:00.

update public.pickup_point_collection_windows
set ends_at = '14:30:00'
where pickup_point_id in (select id from public.pickup_points where is_main_bakery)
  and weekday between 2 and 6
  and ends_at <> '14:30:00';
