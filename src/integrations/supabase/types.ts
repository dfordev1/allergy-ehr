export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      patients: {
        Row: {
          age: number
          contactinfo: Json | null
          createdat: string | null
          dateoftesting: string
          id: string
          labno: string
          name: string
          provisionaldiagnosis: string
          referringphysician: string
          sex: string
          updatedat: string | null
        }
        Insert: {
          age: number
          contactinfo?: Json | null
          createdat?: string | null
          dateoftesting: string
          id?: string
          labno: string
          name: string
          provisionaldiagnosis: string
          referringphysician: string
          sex: string
          updatedat?: string | null
        }
        Update: {
          age?: number
          contactinfo?: Json | null
          createdat?: string | null
          dateoftesting?: string
          id?: string
          labno?: string
          name?: string
          provisionaldiagnosis?: string
          referringphysician?: string
          sex?: string
          updatedat?: string | null
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          controls: Json | null
          createdat: string | null
          id: string
          notes: string | null
          patientid: string
          results: Json | null
          status: string
          technician: string
          testdate: string
          updatedat: string | null
        }
        Insert: {
          controls?: Json | null
          createdat?: string | null
          id?: string
          notes?: string | null
          patientid: string
          results?: Json | null
          status?: string
          technician: string
          testdate: string
          updatedat?: string | null
        }
        Update: {
          controls?: Json | null
          createdat?: string | null
          id?: string
          notes?: string | null
          patientid?: string
          results?: Json | null
          status?: string
          technician?: string
          testdate?: string
          updatedat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_patientid_fkey"
            columns: ["patientid"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          id: string
          patient_id: string
          patient_name: string
          booking_date: string
          booking_time: string
          test_type: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name: string
          booking_date: string
          booking_time: string
          test_type: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string
          booking_date?: string
          booking_time?: string
          test_type?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_allergy_tests: {
        Row: {
          id: string
          patient_id: string
          patient_name: string
          lab_no: string
          age_sex: string | null
          provisional_diagnosis: string | null
          mrd: string | null
          date_of_testing: string
          referred_by: string | null
          test_results: Json
          controls: Json
          technician: string | null
          test_status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name: string
          lab_no: string
          age_sex?: string | null
          provisional_diagnosis?: string | null
          mrd?: string | null
          date_of_testing: string
          referred_by?: string | null
          test_results: Json
          controls: Json
          technician?: string | null
          test_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string
          lab_no?: string
          age_sex?: string | null
          provisional_diagnosis?: string | null
          mrd?: string | null
          date_of_testing?: string
          referred_by?: string | null
          test_results?: Json
          controls?: Json
          technician?: string | null
          test_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_allergy_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          role_id: string | null
          first_name: string
          last_name: string
          email: string
          username: string | null
          phone: string | null
          department: string | null
          license_number: string | null
          is_active: boolean
          last_login_at: string | null
          profile_image_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role_id?: string | null
          first_name: string
          last_name: string
          email: string
          username?: string | null
          phone?: string | null
          department?: string | null
          license_number?: string | null
          is_active?: boolean
          last_login_at?: string | null
          profile_image_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          username?: string | null
          phone?: string | null
          department?: string | null
          license_number?: string | null
          is_active?: boolean
          last_login_at?: string | null
          profile_image_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          createdat: string | null
          email: string
          firstname: string
          id: string
          isactive: boolean | null
          lastlogin: string | null
          lastname: string
          role: string
          updatedat: string | null
          username: string
        }
        Insert: {
          createdat?: string | null
          email: string
          firstname: string
          id?: string
          isactive?: boolean | null
          lastlogin?: string | null
          lastname: string
          role: string
          updatedat?: string | null
          username: string
        }
        Update: {
          createdat?: string | null
          email?: string
          firstname?: string
          id?: string
          isactive?: boolean | null
          lastlogin?: string | null
          lastname?: string
          role?: string
          updatedat?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
