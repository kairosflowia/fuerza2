-- Bug real, encontrado al validar la Fase 4 del Plano Mestre UX/UI con un
-- pago de prueba de extremo a extremo (Stripe CLI + webhook real): la
-- función devuelve una columna "order_id" (returns table(...order_id
-- uuid...)), que Postgres registra como variable PL/pgSQL en el cuerpo de la
-- función. Cualquier referencia sin cualificar a "order_id" dentro de una
-- cláusula WHERE de public.stock_reservations queda ambigua entre esa
-- variable y la columna stock_reservations.order_id -- por eso
-- payment_intent.succeeded fallaba siempre con 42702 "column reference
-- order_id is ambiguous" y ningún pedido llegaba nunca a confirmarse por
-- webhook. Se cualifica cada referencia con el alias de la tabla; el resto
-- de la función queda igual.

create or replace function public.process_payment_event(p_event_id text,p_event_type text,p_payment_intent text,p_amount integer,p_currency text,p_payload_hash text)
returns table(ok boolean,reason text,order_id uuid,public_code text) language plpgsql security definer set search_path='' as $$declare o public.orders;existing public.payment_events;target public.order_status;pay public.payment_status;begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501';end if;
 select * into existing from public.payment_events where stripe_event_id=p_event_id;if found then select * into o from public.orders where id=existing.order_id;return query select true,'already_processed',o.id,o.public_code;return;end if;
 select * into o from public.orders where stripe_payment_intent_id=p_payment_intent for update;insert into public.payment_events(stripe_event_id,event_type,payment_intent_id,order_id,payload_hash) values(p_event_id,p_event_type,p_payment_intent,o.id,p_payload_hash);
 if o.id is null then update public.payment_events set processing_status='ignored',processed_at=now(),error_message='order_not_found' where stripe_event_id=p_event_id;return query select false,'order_not_found',null::uuid,null::text;return;end if;
 if p_event_type='payment_intent.succeeded' then
  if p_amount<>o.total_cents or upper(p_currency)<>o.currency then update public.orders set requires_review=true where id=o.id;update public.payment_events set processing_status='failed',processed_at=now(),error_message='amount_mismatch' where stripe_event_id=p_event_id;return query select false,'amount_mismatch',o.id,o.public_code;return;end if;
  if o.payment_expires_at<now() or exists(select 1 from public.stock_reservations sr where sr.order_id=o.id and (sr.status<>'active' or sr.expires_at<now())) then update public.orders set payment_status='paid',requires_review=true where id=o.id;update public.payment_events set processing_status='processed',processed_at=now() where stripe_event_id=p_event_id;return query select false,'late_payment_review',o.id,o.public_code;return;end if;
  target:='confirmed';pay:='paid';update public.stock_reservations sr set status='converted',converted_order_id=o.id where sr.order_id=o.id and sr.status='active';update public.orders set status=target,payment_status=pay,confirmed_at=coalesce(confirmed_at,now()) where id=o.id;
 elsif p_event_type='payment_intent.processing' then target:='payment_processing';pay:='processing';update public.orders set status=target,payment_status=pay where id=o.id;
 elsif p_event_type in('payment_intent.payment_failed','payment_intent.canceled') then target:='cancelled';pay:=case when p_event_type like '%failed' then 'failed' else 'cancelled' end;update public.orders set status=target,payment_status=pay,cancelled_at=now(),cancellation_reason=p_event_type where id=o.id;update public.stock_reservations sr set status='released' where sr.order_id=o.id and sr.status='active';
 elsif p_event_type in('charge.refunded','charge.refund.updated') then target:='refunded';pay:='refunded';update public.orders set status=target,payment_status=pay where id=o.id;else update public.payment_events set processing_status='ignored',processed_at=now() where stripe_event_id=p_event_id;return query select true,'ignored',o.id,o.public_code;return;end if;
 insert into public.order_status_history(order_id,previous_status,new_status,source,reason) values(o.id,o.status,target,'stripe_webhook',p_event_type);update public.payment_events set processing_status='processed',processed_at=now() where stripe_event_id=p_event_id;insert into public.audit_logs(action,entity_type,entity_id,new_data) values('payment.event','orders',o.id::text,jsonb_build_object('event_type',p_event_type,'payment_status',pay));return query select true,'processed',o.id,o.public_code;
end$$;
