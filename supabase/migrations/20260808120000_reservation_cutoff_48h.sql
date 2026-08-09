-- El documento funcional del cliente exige un mínimo de 48 horas de
-- antelación para cualquier reserva ("Pedidos con un mínimo de 48 horas de
-- antelación", sección 2). La función app_private.variant_availability() ya
-- sabe leer 'availability.cutoff_days_before' + 'availability.cutoff_time'
-- (20260803220000_availability_engine.sql) pero, sin estos dos valores
-- configurados, trata todas las fechas como cerradas por seguridad — ninguna
-- reserva era posible hasta esta migración.
--
-- cutoff_time se fija a las 10:00, la hora de apertura de recogida (sección
-- 2: "Recogida de pedidos: 10:00–14:30"), así el corte queda exactamente a
-- 48 horas del primer instante posible de recogida, no de un instante
-- arbitrario del día.
--
-- Se marcan como públicas (is_public=true) para que el aviso de "reservas
-- con antelación mínima" se pueda mostrar en la web sin autenticación.

insert into public.app_settings (key, value, description, is_public)
values
  ('availability.cutoff_days_before', '2'::jsonb, 'Antelación mínima de reserva en días completos (Documento funcional §2: mínimo 48h).', true),
  ('availability.cutoff_time', '"10:00:00"'::jsonb, 'Hora de corte diaria, combinada con cutoff_days_before, para expresar las 48h mínimas antes de la apertura de recogida (10:00).', true)
on conflict (key) do nothing;
