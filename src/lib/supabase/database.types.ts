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
