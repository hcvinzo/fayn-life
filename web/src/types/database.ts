/**
 * Database type definitions for Supabase
 * These types will be auto-generated once the database schema is finalized
 * For now, we define the basic structure manually
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "practitioner" | "staff" | "assistant";
          practice_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "practitioner" | "staff" | "assistant";
          practice_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "practitioner" | "staff" | "assistant";
          practice_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          practice_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          status: "active" | "inactive" | "archived";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          status?: "active" | "inactive" | "archived";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          status?: "active" | "inactive" | "archived";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      practices: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          practice_id: string;
          client_id: string;
          practitioner_id: string;
          start_time: string;
          end_time: string;
          appointment_type: "in_person" | "online";
          status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          client_id: string;
          practitioner_id: string;
          start_time: string;
          end_time: string;
          appointment_type: "in_person" | "online";
          status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          client_id?: string;
          practitioner_id?: string;
          start_time?: string;
          end_time?: string;
          appointment_type?: "in_person" | "online";
          status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_sessions: {
        Row: {
          id: string;
          practice_id: string;
          appointment_id: string;
          client_id: string;
          practitioner_id: string;
          start_time: string;
          end_time: string | null;
          status: "in_progress" | "completed" | "cancelled";
          notes: string | null;
          attachments: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          appointment_id: string;
          client_id: string;
          practitioner_id: string;
          start_time?: string;
          end_time?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          notes?: string | null;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          appointment_id?: string;
          client_id?: string;
          practitioner_id?: string;
          start_time?: string;
          end_time?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          notes?: string | null;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          practice_id: string;
          entity_type: "client_sessions" | "clients" | "appointments" | "profiles";
          entity_id: string;
          bucket_name: string;
          file_path: string;
          file_name: string;
          file_type: string;
          file_size: number;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          entity_type: "client_sessions" | "clients" | "appointments" | "profiles";
          entity_id: string;
          bucket_name?: string;
          file_path: string;
          file_name: string;
          file_type: string;
          file_size: number;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          entity_type?: "client_sessions" | "clients" | "appointments" | "profiles";
          entity_id?: string;
          bucket_name?: string;
          file_path?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role: "admin" | "practitioner" | "staff" | "assistant";
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role: "admin" | "practitioner" | "staff" | "assistant";
          permission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "practitioner" | "staff" | "assistant";
          permission_id?: string;
          created_at?: string;
        };
      };
      practitioner_assignments: {
        Row: {
          id: string;
          assistant_id: string;
          practitioner_id: string;
          practice_id: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          assistant_id: string;
          practitioner_id: string;
          practice_id: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          assistant_id?: string;
          practitioner_id?: string;
          practice_id?: string;
          created_at?: string;
          created_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "practitioner" | "staff" | "assistant";
      appointment_status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
      appointment_type: "in_person" | "online";
      client_status: "active" | "inactive" | "archived";
      session_status: "in_progress" | "completed" | "cancelled";
      entity_type: "client_sessions" | "clients" | "appointments" | "profiles";
      availability_status: "off" | "online_only" | "in_person_only";
    };
  };
}
