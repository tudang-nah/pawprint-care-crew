export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      booking_items: {
        Row: {
          booking_id: string
          id: string
          name: string
          price: number
          service_id: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          name: string
          price: number
          service_id?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          name?: string
          price?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          id: string
          note: string
          pet_id: string | null
          pet_name: string
          species: string
          staff_id: string | null
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          total: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          id?: string
          note?: string
          pet_id?: string | null
          pet_name: string
          species: string
          staff_id?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          note?: string
          pet_id?: string | null
          pet_name?: string
          species?: string
          staff_id?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      care_members: {
        Row: {
          email: string
          role: Database["public"]["Enums"]["care_role"]
        }
        Insert: {
          email: string
          role?: Database["public"]["Enums"]["care_role"]
        }
        Update: {
          email?: string
          role?: Database["public"]["Enums"]["care_role"]
        }
        Relationships: []
      }
      care_state: {
        Row: {
          data: Json
          id: boolean
          version: number
        }
        Insert: {
          data?: Json
          id?: boolean
          version?: number
        }
        Update: {
          data?: Json
          id?: boolean
          version?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          breed: string
          created_at: string
          customer_id: string
          id: string
          name: string
          notes: string
          species: string
          weight: number
        }
        Insert: {
          breed?: string
          created_at?: string
          customer_id: string
          id?: string
          name: string
          notes?: string
          species?: string
          weight?: number
        }
        Update: {
          breed?: string
          created_at?: string
          customer_id?: string
          id?: string
          name?: string
          notes?: string
          species?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "pets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rules: {
        Row: {
          id: string
          max_kg: number | null
          min_kg: number
          price: number
          service_id: string
          species: string
        }
        Insert: {
          id?: string
          max_kg?: number | null
          min_kg?: number
          price: number
          service_id: string
          species: string
        }
        Update: {
          id?: string
          max_kg?: number | null
          min_kg?: number
          price?: number
          service_id?: string
          species?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string
          display_name: string
          user_id: string
        }
        Insert: {
          avatar_path?: string
          display_name?: string
          user_id: string
        }
        Update: {
          avatar_path?: string
          display_name?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          description: string
          duration_min: number
          id: string
          image_url: string
          name: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          image_url?: string
          name: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          cancel_hours: number
          close_hour: number
          id: boolean
          open_hour: number
          slot_capacity: number
        }
        Insert: {
          cancel_hours?: number
          close_hour?: number
          id?: boolean
          open_hour?: number
          slot_capacity?: number
        }
        Update: {
          cancel_hours?: number
          close_hour?: number
          id?: boolean
          open_hour?: number
          slot_capacity?: number
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          day: string
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          day: string
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          day?: string
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      surcharges: {
        Row: {
          active: boolean
          amount: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          amount: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          amount?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_booking: {
        Args: { _booking: string; _staff: string }
        Returns: undefined
      }
      care_has_access: { Args: { admin_only?: boolean }; Returns: boolean }
      care_manage_member: {
        Args: { member_email: string; remove_member?: boolean }
        Returns: undefined
      }
      care_read: {
        Args: never
        Returns: {
          data: Json
          id: boolean
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "care_state"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      care_save: {
        Args: { expected_version: number; next_data: Json }
        Returns: number
      }
      change_my_booking: {
        Args: { _booking: string; _new_start: string }
        Returns: undefined
      }
      check_slot: {
        Args: { _ignore: string; _start: string }
        Returns: undefined
      }
      create_booking: {
        Args: {
          _note: string
          _pet: string
          _services: string[]
          _start: string
          _surcharges: string[]
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team: { Args: { _user_id: string }; Returns: boolean }
      list_team: {
        Args: never
        Returns: {
          display_name: string
          email: string
          role: string
          user_id: string
        }[]
      }
      my_role: { Args: never; Returns: string }
      owns_customer: { Args: { _customer: string }; Returns: boolean }
      service_price: {
        Args: { _service: string; _species: string; _weight: number }
        Returns: number
      }
      set_booking_status: {
        Args: {
          _booking: string
          _status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
      set_user_role: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      slot_usage: {
        Args: { _from: string; _to: string }
        Returns: {
          start_at: string
          used: number
        }[]
      }
      staff_sees_customer: { Args: { _customer: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      booking_status:
        | "pending"
        | "confirmed"
        | "caring"
        | "completed"
        | "cancelled"
      care_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "customer"],
      booking_status: [
        "pending",
        "confirmed",
        "caring",
        "completed",
        "cancelled",
      ],
      care_role: ["admin", "member"],
    },
  },
} as const
