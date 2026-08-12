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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      giveaway_entries: {
        Row: {
          age_confirmed: boolean
          contact_attempts: number
          contact_outcome: string | null
          created_at: string
          eligibility_status: string
          email: string
          email_normalized: string
          exclusion_reason: string | null
          first_name: string
          giveaway_id: string
          id: string
          ip_hash: string | null
          judge_name: string | null
          judged_at: string | null
          last_name: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          response: string
          response_word_count: number
          score_clarity: number | null
          score_relevance: number | null
          score_safety: number | null
          score_total: number | null
          source: string | null
          state_territory: string
          terms_accepted: boolean
          terms_accepted_at: string
          terms_version: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          winner_status: string
        }
        Insert: {
          age_confirmed: boolean
          contact_attempts?: number
          contact_outcome?: string | null
          created_at?: string
          eligibility_status?: string
          email: string
          email_normalized: string
          exclusion_reason?: string | null
          first_name: string
          giveaway_id: string
          id?: string
          ip_hash?: string | null
          judge_name?: string | null
          judged_at?: string | null
          last_name: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          response: string
          response_word_count: number
          score_clarity?: number | null
          score_relevance?: number | null
          score_safety?: number | null
          score_total?: number | null
          source?: string | null
          state_territory: string
          terms_accepted: boolean
          terms_accepted_at?: string
          terms_version: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          winner_status?: string
        }
        Update: {
          age_confirmed?: boolean
          contact_attempts?: number
          contact_outcome?: string | null
          created_at?: string
          eligibility_status?: string
          email?: string
          email_normalized?: string
          exclusion_reason?: string | null
          first_name?: string
          giveaway_id?: string
          id?: string
          ip_hash?: string | null
          judge_name?: string | null
          judged_at?: string | null
          last_name?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          response?: string
          response_word_count?: number
          score_clarity?: number | null
          score_relevance?: number | null
          score_safety?: number | null
          score_total?: number | null
          source?: string | null
          state_territory?: string
          terms_accepted?: boolean
          terms_accepted_at?: string
          terms_version?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          winner_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaway_launch_config"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_launch_config: {
        Row: {
          closes_at: string
          created_at: string
          id: string
          launch_enabled: boolean
          opens_at: string
          prize_name: string
          prize_sku: string
          prize_value_aud: number
          supplier_confirmation_note: string | null
          supplier_confirmed: boolean
          terms_version: string
          updated_at: string
        }
        Insert: {
          closes_at: string
          created_at?: string
          id: string
          launch_enabled?: boolean
          opens_at: string
          prize_name: string
          prize_sku: string
          prize_value_aud: number
          supplier_confirmation_note?: string | null
          supplier_confirmed?: boolean
          terms_version: string
          updated_at?: string
        }
        Update: {
          closes_at?: string
          created_at?: string
          id?: string
          launch_enabled?: boolean
          opens_at?: string
          prize_name?: string
          prize_sku?: string
          prize_value_aud?: number
          supplier_confirmation_note?: string | null
          supplier_confirmed?: boolean
          terms_version?: string
          updated_at?: string
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
