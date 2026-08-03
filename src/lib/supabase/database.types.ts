export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "customer" | "owner" | "admin" | "operator" | "pickup_manager";

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
      product_variants: { Row: { id:string; product_id:string; name:string; approximate_weight_grams:number|null; price_cents:number|null; vat_rate:number; status:"draft"|"active"|"unavailable"|"discontinued"; display_order:number; created_at:string; updated_at:string }; Insert: { id?:string; product_id:string; name:string; approximate_weight_grams?:number|null; price_cents?:number|null; vat_rate:number; status?:"draft"|"active"|"unavailable"|"discontinued"; display_order?:number }; Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>; Relationships: [] };
      ingredients: { Row:{id:string;name:string;created_at:string}; Insert:{id?:string;name:string}; Update:{name?:string}; Relationships:[] };
      product_ingredients: { Row:{product_id:string;ingredient_id:string;display_order:number;notes:string|null}; Insert:{product_id:string;ingredient_id:string;display_order?:number;notes?:string|null}; Update:{display_order?:number;notes?:string|null}; Relationships:[] };
      allergens: { Row:{id:string;code:string;name:string;display_order:number}; Insert:{id?:string;code:string;name:string;display_order:number}; Update:{name?:string;display_order?:number}; Relationships:[] };
      product_allergens: { Row:{product_id:string;allergen_id:string;presence_type:"contains"|"may_contain";notes:string|null}; Insert:{product_id:string;allergen_id:string;presence_type:"contains"|"may_contain";notes?:string|null}; Update:{notes?:string|null}; Relationships:[] };
      product_images: { Row:{id:string;product_id:string;storage_path:string;alt_text:string|null;display_order:number;is_primary:boolean;created_at:string}; Insert:{id?:string;product_id:string;storage_path:string;alt_text?:string|null;display_order?:number;is_primary?:boolean}; Update:{alt_text?:string|null;display_order?:number;is_primary?:boolean}; Relationships:[] };
      product_production_weekdays: { Row:{product_id:string;weekday:number;is_active:boolean}; Insert:{product_id:string;weekday:number;is_active?:boolean}; Update:{is_active?:boolean}; Relationships:[] };
      pickup_points: { Row:{id:string;name:string;slug:string;status:"active"|"hidden";created_at:string;updated_at:string}; Insert:{id?:string;name:string;slug:string;status?:"active"|"hidden"}; Update:{name?:string;slug?:string;status?:"active"|"hidden"}; Relationships:[] };
      product_pickup_points: { Row:{product_id:string;pickup_point_id:string;is_available:boolean}; Insert:{product_id:string;pickup_point_id:string;is_available?:boolean}; Update:{is_available?:boolean}; Relationships:[] };
    };
    Views: Record<string, never>;
    Functions: {
      assign_user_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
      remove_user_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
      log_admin_event: { Args: { event_action: string; event_metadata?: Json }; Returns: undefined };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
}
