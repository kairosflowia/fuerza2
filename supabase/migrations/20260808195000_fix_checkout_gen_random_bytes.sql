-- Bug preexistente descubierto al escribir los tests de cancelación
-- (20260808190000_cancellation_policy.sql), que fue la primera vez que
-- create_checkout_order() se ejecutaba con éxito de principio a fin dentro
-- de la batería de tests: la función fija `search_path=''` (correcto y
-- deliberado, ver el resto de funciones de este proyecto), pero llama a
-- gen_random_bytes(32) sin cualificar. gen_random_uuid() funciona sin
-- problema porque en Postgres 13+ vive en pg_catalog (siempre visible), pero
-- gen_random_bytes() es de pgcrypto, instalada en el esquema `extensions` --
-- con `search_path=''` esa llamada falla con "function gen_random_bytes(integer)
-- does not exist" en cualquier entorno, no solo en pruebas. En la práctica
-- esto significa que ningún checkout público real (el único camino que crea
-- la reserva de stock con este token) podía completarse: fallaba siempre al
-- generar el token de la reserva. Se corrige cualificando la llamada como
-- extensions.gen_random_bytes(32); mismo comportamiento previo en todo lo
-- demás -- create or replace conserva la firma exacta.

create or replace function public.create_checkout_order(p_items jsonb,p_pickup_point_id uuid,p_collection_date date,p_session_key text,p_customer_id uuid,p_name text,p_email text,p_phone text,p_terms_version text,p_privacy_version text,p_marketing boolean,p_lookup_hash text)
returns table(ok boolean,reason text,order_id uuid,public_code text,total_cents integer,expires_at timestamptz) language plpgsql security definer set search_path='' as $$
declare i jsonb;v record;av record;o public.orders;oid uuid;rid uuid;code text;subtotal integer:=0;tax integer:=0;line integer;line_tax integer;expiry timestamptz:=now()+interval '15 minutes';qty integer;vid uuid;
begin
 select * into o from public.orders where checkout_key=p_session_key;if found then return query select true,'already_created',o.id,o.public_code,o.total_cents,o.payment_expires_at;return;end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or trim(coalesce(p_name,''))='' or position('@' in coalesce(p_email,''))<2 or trim(coalesce(p_phone,''))='' or p_terms_version is null or p_privacy_version is null then return query select false,'invalid_checkout',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
 if p_customer_id is not null and p_customer_id<>auth.uid() and auth.role()<>'service_role' then raise exception 'insufficient_privilege' using errcode='42501';end if;
 perform public.expire_stock_reservations();
 for i in select value from jsonb_array_elements(p_items) order by value->>'variant_id' loop
  vid:=(i->>'variant_id')::uuid;qty:=(i->>'quantity')::integer;if qty<=0 then return query select false,'invalid_quantity',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
  perform pg_advisory_xact_lock(1,hashtext(vid::text||p_collection_date::text));perform pg_advisory_xact_lock(2,hashtext(p_pickup_point_id::text||p_collection_date::text));
  select pv.*,p.name product_name,p.status product_status into v from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=vid;
  if not found or v.status<>'active' or v.product_status not in('active','seasonal') or v.price_cents is null then return query select false,'variant_unavailable',null::uuid,null::text,null::integer,null::timestamptz;return;end if;
  select * into av from app_private.variant_availability(vid,p_pickup_point_id,p_collection_date);if not av.is_available or qty>av.remaining then return query select false,coalesce(av.reason,'sold_out'),null::uuid,null::text,null::integer,null::timestamptz;return;end if;
 end loop;
 code:='FZ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.orders(public_code,customer_id,customer_name,customer_email,customer_phone,pickup_point_id,collection_date,status,payment_status,payment_expires_at,subtotal_cents,tax_cents,total_cents,currency,terms_version,privacy_version,marketing_consent,lookup_token_hash,checkout_key)
 values(code,p_customer_id,trim(p_name),lower(trim(p_email)),trim(p_phone),p_pickup_point_id,p_collection_date,'pending_payment','pending',expiry,0,0,0,'EUR',p_terms_version,p_privacy_version,coalesce(p_marketing,false),p_lookup_hash,p_session_key) returning id into oid;
 for i in select value from jsonb_array_elements(p_items) loop vid:=(i->>'variant_id')::uuid;qty:=(i->>'quantity')::integer;select pv.*,p.id product_id,p.name product_name into v from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=vid;line:=v.price_cents*qty;line_tax:=round(line*(v.vat_rate/(100+v.vat_rate)));subtotal:=subtotal+line-line_tax;tax:=tax+line_tax;
  insert into public.stock_reservations(token,session_key,customer_id,product_variant_id,pickup_point_id,collection_date,quantity,status,expires_at,order_id) values(encode(extensions.gen_random_bytes(32),'hex'),p_session_key,p_customer_id,vid,p_pickup_point_id,p_collection_date,qty,'active',expiry,oid) returning id into rid;
  if (select reservation_id is null from public.orders where id=oid) then update public.orders set reservation_id=rid where id=oid;end if;
  insert into public.order_items(order_id,product_id,product_variant_id,product_name_snapshot,variant_name_snapshot,approximate_weight_snapshot,unit_price_cents,vat_rate_snapshot,tax_cents,quantity,line_total_cents) values(oid,v.product_id,vid,v.product_name,v.name,v.approximate_weight_grams,v.price_cents,v.vat_rate,line_tax,qty,line);
 end loop;
 update public.orders set subtotal_cents=subtotal,tax_cents=tax,total_cents=subtotal+tax where id=oid;insert into public.order_status_history(order_id,new_status,actor_id,source,reason) values(oid,'pending_payment',p_customer_id,'customer','checkout_created');insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_data) values(p_customer_id,'order.created','orders',oid::text,jsonb_build_object('public_code',code,'total_cents',subtotal+tax));return query select true,'pending_payment',oid,code,subtotal+tax,expiry;
end$$;
