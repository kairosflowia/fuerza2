export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "customer" | "owner" | "admin" | "operator" | "pickup_manager";
export type PickupPointType = "bakery" | "external";
export type PickupPointStatus = "draft" | "active" | "temporarily_unavailable" | "coming_soon" | "inactive";
export type PickupExceptionType = "closed" | "extraordinary_opening" | "schedule_override" | "capacity_override";
export type ProductionDateStatus = "draft" | "open" | "closed" | "cancelled";
export type StockReservationStatus = "active" | "expired" | "released" | "converted";
export type OrderStatus = "draft"|"pending_payment"|"payment_processing"|"confirmed"|"ready"|"collected"|"cancelled"|"refunded"|"partially_refunded";
export type PaymentStatus="not_started"|"pending"|"processing"|"paid"|"failed"|"cancelled"|"refunded"|"partially_refunded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; phone: string | null; locale: string; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; phone?: string | null; locale?: string; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; phone?: string | null; locale?: string; updated_at?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: AppRole; granted_by: string | null; created_at: string };
        Insert: { user_id: string; role: AppRole; granted_by?: string | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
      customer_consents: {
        Row: { id: string; customer_id: string; consent_type: string; granted: boolean; source: string; version: string; created_at: string };
        Insert: { id?: string; customer_id: string; consent_type: string; granted: boolean; source: string; version: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; previous_data: Json | null; new_data: Json | null; metadata: Json; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      app_settings: {
        Row: { key: string; value: Json; description: string | null; is_public: boolean; updated_by: string | null; updated_at: string };
        Insert: { key: string; value: Json; description?: string | null; is_public?: boolean; updated_by?: string | null; updated_at?: string };
        Update: { value?: Json; description?: string | null; is_public?: boolean; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      product_families: { Row: { id:string; name:string; slug:string; description:string|null; color_key:string; display_order:number; status:"active"|"hidden"; created_at:string; updated_at:string }; Insert: { id?:string; name:string; slug:string; description?:string|null; color_key?:string; display_order?:number; status?:"active"|"hidden" }; Update: Partial<Database["public"]["Tables"]["product_families"]["Insert"]>; Relationships: [] };
      products: { Row: { id:string; family_id:string; name:string; slug:string; short_description:string|null; long_description:string|null; flour_type:string|null; flour_origin:string|null; fermentation_hours:number|null; status:"draft"|"active"|"seasonal"|"unavailable"|"discontinued"; display_order:number; seo_title:string|null; seo_description:string|null; created_at:string; updated_at:string }; Insert: { id?:string; family_id:string; name:string; slug:string; short_description?:string|null; long_description?:string|null; flour_type?:string|null; flour_origin?:string|null; fermentation_hours?:number|null; status?:"draft"|"active"|"seasonal"|"unavailable"|"discontinued"; display_order?:number; seo_title?:string|null; seo_description?:string|null }; Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>; Relationships: [] };
      product_variants: { Row: { id:string; product_id:string; name:string; approximate_weight_grams:number|null; price_cents:number|null; vat_rate:number; status:"draft"|"active"|"unavailable"|"discontinued"; display_order:number; stock_tracking:boolean; stock_quantity:number; low_stock_threshold:number|null; subscribable:boolean; created_at:string; updated_at:string }; Insert: { id?:string; product_id:string; name:string; approximate_weight_grams?:number|null; price_cents?:number|null; vat_rate:number; status?:"draft"|"active"|"unavailable"|"discontinued"; display_order?:number; stock_tracking?:boolean; low_stock_threshold?:number|null; subscribable?:boolean }; Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>; Relationships: [] };
      product_stock_movements: { Row: { id:string; product_variant_id:string; type:"entrada"|"venta"|"merma"|"ajuste"|"devolucion"; quantity:number; order_id:string|null; notes:string|null; created_by:string|null; created_at:string }; Insert: { id?:string; product_variant_id:string; type:"entrada"|"venta"|"merma"|"ajuste"|"devolucion"; quantity:number; order_id?:string|null; notes?:string|null; created_by?:string|null }; Update: never; Relationships: [] };
      ingredients: { Row:{id:string;name:string;created_at:string}; Insert:{id?:string;name:string}; Update:{name?:string}; Relationships:[] };
      product_ingredients: { Row:{product_id:string;ingredient_id:string;display_order:number;notes:string|null}; Insert:{product_id:string;ingredient_id:string;display_order?:number;notes?:string|null}; Update:{display_order?:number;notes?:string|null}; Relationships:[] };
      allergens: { Row:{id:string;code:string;name:string;display_order:number}; Insert:{id?:string;code:string;name:string;display_order:number}; Update:{name?:string;display_order?:number}; Relationships:[] };
      product_allergens: { Row:{product_id:string;allergen_id:string;presence_type:"contains"|"may_contain";notes:string|null}; Insert:{product_id:string;allergen_id:string;presence_type:"contains"|"may_contain";notes?:string|null}; Update:{notes?:string|null}; Relationships:[] };
      product_attributes: { Row:{product_id:string;attribute_code:string}; Insert:{product_id:string;attribute_code:string}; Update:{attribute_code?:string}; Relationships:[] };
      product_images: { Row:{id:string;product_id:string;storage_path:string;alt_text:string|null;display_order:number;is_primary:boolean;created_at:string}; Insert:{id?:string;product_id:string;storage_path:string;alt_text?:string|null;display_order?:number;is_primary?:boolean}; Update:{alt_text?:string|null;display_order?:number;is_primary?:boolean}; Relationships:[] };
      weekly_specials: { Row:{id:string;product_id:string;collection_date:string;headline:string|null;created_by:string|null;created_at:string;updated_at:string}; Insert:{id?:string;product_id:string;collection_date:string;headline?:string|null;created_by?:string|null}; Update:Partial<Database["public"]["Tables"]["weekly_specials"]["Insert"]>; Relationships:[] };
      product_production_weekdays: { Row:{product_id:string;weekday:number;is_active:boolean}; Insert:{product_id:string;weekday:number;is_active?:boolean}; Update:{is_active?:boolean}; Relationships:[] };
      pickup_points: { Row:{id:string;name:string;slug:string;type:PickupPointType;status:PickupPointStatus;is_main_bakery:boolean;accepts_all_products:boolean;address_line_1:string|null;address_line_2:string|null;postal_code:string|null;city:string|null;province:string|null;country_code:string;latitude:number|null;longitude:number|null;public_instructions:string|null;internal_notes:string|null;contact_name:string|null;contact_phone:string|null;contact_email:string|null;display_order:number;is_public:boolean;created_at:string;updated_at:string}; Insert:{id?:string;name:string;slug:string;type?:PickupPointType;status?:PickupPointStatus;is_main_bakery?:boolean;accepts_all_products?:boolean;address_line_1?:string|null;address_line_2?:string|null;postal_code?:string|null;city?:string|null;province?:string|null;country_code?:string;latitude?:number|null;longitude?:number|null;public_instructions?:string|null;internal_notes?:string|null;contact_name?:string|null;contact_phone?:string|null;contact_email?:string|null;display_order?:number;is_public?:boolean}; Update: Partial<Database["public"]["Tables"]["pickup_points"]["Insert"]>; Relationships: [] };
      pickup_point_opening_hours: { Row:{id:string;pickup_point_id:string;weekday:number;opens_at:string|null;closes_at:string|null;is_closed:boolean;created_at:string;updated_at:string}; Insert:{id?:string;pickup_point_id:string;weekday:number;opens_at?:string|null;closes_at?:string|null;is_closed?:boolean}; Update: Partial<Database["public"]["Tables"]["pickup_point_opening_hours"]["Insert"]>; Relationships: [] };
      pickup_point_collection_windows: { Row:{id:string;pickup_point_id:string;weekday:number;starts_at:string;ends_at:string;is_active:boolean;created_at:string;updated_at:string}; Insert:{id?:string;pickup_point_id:string;weekday:number;starts_at:string;ends_at:string;is_active?:boolean}; Update: Partial<Database["public"]["Tables"]["pickup_point_collection_windows"]["Insert"]>; Relationships: [] };
      pickup_point_capacity_defaults: { Row:{id:string;pickup_point_id:string;weekday:number;max_units:number;created_at:string;updated_at:string}; Insert:{id?:string;pickup_point_id:string;weekday:number;max_units:number}; Update:{max_units?:number}; Relationships: [] };
      pickup_point_exceptions: { Row:{id:string;pickup_point_id:string;exception_date:string;type:PickupExceptionType;collection_starts_at:string|null;collection_ends_at:string|null;capacity_override:number|null;public_message:string|null;internal_reason:string|null;created_by:string|null;created_at:string;updated_at:string}; Insert:{id?:string;pickup_point_id:string;exception_date:string;type:PickupExceptionType;collection_starts_at?:string|null;collection_ends_at?:string|null;capacity_override?:number|null;public_message?:string|null;internal_reason?:string|null;created_by?:string|null}; Update: Partial<Database["public"]["Tables"]["pickup_point_exceptions"]["Insert"]>; Relationships: [] };
      global_closures: { Row:{id:string;starts_on:string;ends_on:string;public_message:string|null;internal_reason:string|null;created_by:string|null;created_at:string;updated_at:string}; Insert:{id?:string;starts_on:string;ends_on:string;public_message?:string|null;internal_reason?:string|null;created_by?:string|null}; Update: Partial<Database["public"]["Tables"]["global_closures"]["Insert"]>; Relationships: [] };
      product_pickup_points: { Row:{product_id:string;pickup_point_id:string;is_available:boolean;created_at:string;updated_at:string}; Insert:{product_id:string;pickup_point_id:string;is_available?:boolean}; Update:{is_available?:boolean}; Relationships:[] };
      production_dates: { Row:{id:string;product_variant_id:string;production_date:string;total_capacity:number;reserved_for_subscriptions:number;status:ProductionDateStatus;notes:string|null;created_by:string|null;created_at:string;updated_at:string}; Insert:{id?:string;product_variant_id:string;production_date:string;total_capacity:number;reserved_for_subscriptions?:number;status?:ProductionDateStatus;notes?:string|null;created_by?:string|null}; Update: Partial<Database["public"]["Tables"]["production_dates"]["Insert"]>; Relationships: [] };
      availability_overrides: { Row:{id:string;product_variant_id:string;pickup_point_id:string|null;availability_date:string;capacity_override:number;reason:string|null;created_by:string|null;created_at:string;updated_at:string}; Insert:{id?:string;product_variant_id:string;pickup_point_id?:string|null;availability_date:string;capacity_override:number;reason?:string|null;created_by?:string|null}; Update: Partial<Database["public"]["Tables"]["availability_overrides"]["Insert"]>; Relationships: [] };
      stock_reservations: { Row:{id:string;token:string;session_key:string;customer_id:string|null;product_variant_id:string;pickup_point_id:string;collection_date:string;quantity:number;status:StockReservationStatus;expires_at:string;extended_at:string|null;converted_order_id:string|null;created_at:string;updated_at:string}; Insert:never; Update:never; Relationships: [] };
      orders: { Row:{id:string;public_code:string;customer_id:string|null;customer_name:string|null;customer_email:string|null;customer_phone:string|null;pickup_point_id:string;collection_date:string;status:OrderStatus;payment_status:PaymentStatus;total_cents:number;subtotal_cents:number;tax_cents:number;currency:string;channel:string;internal_note:string|null;stripe_payment_intent_id:string|null;payment_expires_at:string|null;confirmed_at:string|null;cancelled_at:string|null;cancellation_reason:string|null;requires_review:boolean;created_at:string;updated_at:string}; Insert:never; Update:never; Relationships: [] };
      order_items: { Row:{id:string;order_id:string;product_id:string|null;product_variant_id:string;product_name_snapshot:string;variant_name_snapshot:string;approximate_weight_snapshot:number|null;unit_price_cents:number;vat_rate_snapshot:number;tax_cents:number;quantity:number;line_total_cents:number;created_at:string}; Insert:never; Update:never; Relationships: [] };
      order_status_history:{Row:{id:string;order_id:string;previous_status:OrderStatus|null;new_status:OrderStatus;actor_id:string|null;source:"customer"|"admin"|"operator"|"stripe_webhook"|"system";reason:string|null;metadata:Json;created_at:string};Insert:never;Update:never;Relationships:[]};
      payment_events:{Row:{id:string;stripe_event_id:string;event_type:string;payment_intent_id:string|null;order_id:string|null;processing_status:"received"|"processed"|"ignored"|"failed";payload_hash:string|null;error_message:string|null;processed_at:string|null;created_at:string};Insert:never;Update:never;Relationships:[]};
      store_credits:{Row:{id:string;code:string;customer_id:string|null;email:string|null;amount_cents:number;currency:string;status:"active"|"redeemed"|"expired";issued_from_order_id:string|null;redeemed_order_id:string|null;notes:string|null;created_at:string;updated_at:string};Insert:{id?:string;code:string;customer_id?:string|null;email?:string|null;amount_cents:number;currency?:string;status?:"active"|"redeemed"|"expired";issued_from_order_id?:string|null;redeemed_order_id?:string|null;notes?:string|null};Update:Partial<Database["public"]["Tables"]["store_credits"]["Insert"]>;Relationships:[]};
      subscription_capacity_allocations: { Row:{id:string;product_variant_id:string;pickup_point_id:string|null;allocation_date:string;quantity:number;source_reference:string|null;created_at:string;updated_at:string}; Insert:{id?:string;product_variant_id:string;pickup_point_id?:string|null;allocation_date:string;quantity:number;source_reference?:string|null}; Update: Partial<Database["public"]["Tables"]["subscription_capacity_allocations"]["Insert"]>; Relationships: [] };
    };
    Views: {
      pickup_points_public: { Row:{id:string;name:string;slug:string;type:PickupPointType;status:PickupPointStatus;is_main_bakery:boolean;address_line_1:string|null;address_line_2:string|null;postal_code:string|null;city:string|null;province:string|null;country_code:string;latitude:number|null;longitude:number|null;public_instructions:string|null;display_order:number}; Relationships: [] };
      pickup_point_opening_hours_public: { Row:{id:string;pickup_point_id:string;weekday:number;opens_at:string|null;closes_at:string|null;is_closed:boolean}; Relationships: [] };
      pickup_point_collection_windows_public: { Row:{id:string;pickup_point_id:string;weekday:number;starts_at:string;ends_at:string}; Relationships: [] };
      pickup_point_exceptions_public: { Row:{id:string;pickup_point_id:string;exception_date:string;type:PickupExceptionType;collection_starts_at:string|null;collection_ends_at:string|null;public_message:string|null}; Relationships: [] };
      global_closures_public: { Row:{id:string;starts_on:string;ends_on:string;public_message:string|null}; Relationships: [] };
    };
    Functions: {
      assign_user_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
      remove_user_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
      log_admin_event: { Args: { event_action: string; event_metadata?: Json }; Returns: undefined };
      create_stock_reservation: { Args: { p_product_variant_id: string; p_pickup_point_id: string; p_collection_date: string; p_quantity: number; p_session_key: string; p_customer_id?: string | null }; Returns: { ok: boolean; reason: string; reservation_id: string | null; token: string | null; expires_at: string | null; quantity_available: number | null }[] };
      expire_stock_reservations: { Args: Record<string, never>; Returns: number };
      extend_stock_reservation: { Args: { p_token: string }; Returns: { ok: boolean; reason: string; expires_at: string | null }[] };
      convert_reservation_to_order: { Args: { p_token: string; p_guest_email?: string | null; p_guest_phone?: string | null }; Returns: { ok: boolean; reason: string; order_id: string | null; public_code: string | null }[] };
      cancel_order: { Args: { p_order_id: string; p_reason?: string | null }; Returns: { ok: boolean; reason: string }[] };
      mark_order_paid_manually: { Args: { p_order_id: string; p_reason?: string | null }; Returns: { ok: boolean; reason: string }[] };
      create_staff_order: { Args: { p_items: Json; p_pickup_point_id: string; p_collection_date: string; p_customer_name: string; p_customer_phone: string; p_customer_email?: string | null; p_channel?: string; p_payment_status?: string; p_notes?: string | null }; Returns: { ok: boolean; reason: string; order_id: string | null; public_code: string | null; total_cents: number | null }[] };
      request_order_cancellation: { Args: { p_public_code: string; p_lookup_hash: string; p_reason?: string | null }; Returns: { ok: boolean; reason: string; resolution: string | null; voucher_code: string | null }[] };
      set_production_date_status: { Args: { p_id: string; p_status: ProductionDateStatus }; Returns: { ok: boolean; reason: string }[] };
      register_stock_movement: { Args: { p_product_variant_id: string; p_type: "entrada" | "produccion" | "merma" | "ajuste"; p_quantity: number; p_notes?: string | null }; Returns: { id: string; product_variant_id: string; type: string; quantity: number; order_id: string | null; notes: string | null; created_by: string | null; created_at: string } };
      variant_stock_status: { Args: { p_product_id?: string | null }; Returns: { variant_id: string; product_id: string; product_name: string; variant_name: string; stock_tracking: boolean; stock_quantity: number; reserved_quantity: number; available_quantity: number; low_stock_threshold: number; stock_state: "agotado" | "stock_bajo" | "disponible" | "no_controlado"; last_movement_at: string | null }[] };
      variant_stock_timeline: { Args: { p_variant_id: string; p_limit?: number }; Returns: { occurred_at: string; type: string; category: "stock" | "reservation"; quantity: number; stock_before: number | null; stock_after: number | null; order_id: string | null; notes: string | null; actor_name: string }[] };
      inventory_dashboard_alerts: { Args: Record<string, never>; Returns: { out_of_stock_count: number; low_stock_count: number; expiring_reservations_count: number; recent_mermas_count: number; pending_orders_count: number; paid_pending_prep_count: number }[] };
      admin_customer_directory: { Args: { p_query?: string | null }; Returns: { customer_id: string; email: string | null; full_name: string | null; phone: string | null; created_at: string; orders_count: number; total_spent_cents: number; last_order_at: string | null }[] };
      check_variant_availability: { Args: { p_product_variant_id: string; p_pickup_point_id: string; p_collection_date: string }; Returns: { status: "available" | "low_stock" | "sold_out"; reason: string; quantity_available: number | null }[] };
      next_available_date: { Args: { p_product_variant_id: string; p_pickup_point_id: string; p_from_date?: string; p_horizon_days?: number }; Returns: string | null };
      available_pickup_points_for_variant: { Args: { p_product_variant_id: string; p_collection_date: string }; Returns: { pickup_point_id: string; status: "available" | "low_stock" | "sold_out"; reason: string; quantity_available: number | null }[] };
      newsletter_subscribe: { Args: { p_email: string; p_consent: boolean; p_consent_version: string; p_source: string; p_confirm_token_hash: string; p_token_expires_at: string; p_confirm_url: string }; Returns: { ok: boolean; reason: string; needs_confirmation: boolean }[] };
      newsletter_confirm: { Args: { p_token_hash: string; p_unsubscribe_token_hash: string; p_unsubscribe_url: string }; Returns: { ok: boolean; reason: string }[] };
      newsletter_unsubscribe: { Args: { p_token_hash: string; p_reason?: string | null }; Returns: { ok: boolean; reason: string }[] };
      admin_newsletter_directory: { Args: { p_query?: string | null; p_status?: string | null }; Returns: { id: string; email: string; full_name: string | null; customer_id: string | null; status: "pendiente" | "activo" | "baja" | "bloqueado"; source: string; subscribed_at: string; confirmed_at: string | null; unsubscribed_at: string | null; last_activity_at: string; can_reactivate: boolean }[] };
      admin_newsletter_resend_confirmation: { Args: { p_subscriber_id: string; p_confirm_token_hash: string; p_token_expires_at: string; p_confirm_url: string }; Returns: { ok: boolean; reason: string }[] };
      admin_newsletter_set_status: { Args: { p_subscriber_id: string; p_status: string; p_reason?: string | null }; Returns: { ok: boolean; reason: string }[] };
      admin_newsletter_consent_history: { Args: { p_subscriber_id: string }; Returns: { event_type: string; consent_version: string | null; source: string | null; actor_name: string; created_at: string }[] };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
}
