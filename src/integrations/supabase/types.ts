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
      albums: {
        Row: {
          cover_photo_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      future_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          done: boolean
          done_on: string | null
          id: string
          notes: string | null
          photo_path: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          done?: boolean
          done_on?: string | null
          id?: string
          notes?: string | null
          photo_path?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          done?: boolean
          done_on?: string | null
          id?: string
          notes?: string | null
          photo_path?: string | null
          title?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          revoked: boolean
          role: Database["public"]["Enums"]["app_role"]
          token_hash: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          token_hash: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          token_hash?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      letters: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_private: boolean
          is_special: boolean
          photo_path: string | null
          title: string
          unlock_at: string | null
          written_on: string
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean
          is_special?: boolean
          photo_path?: string | null
          title: string
          unlock_at?: string | null
          written_on?: string
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean
          is_special?: boolean
          photo_path?: string | null
          title?: string
          unlock_at?: string | null
          written_on?: string
        }
        Relationships: []
      }
      love_notes: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          happened_on: string
          id: string
          is_favorite: boolean
          place_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          happened_on: string
          id?: string
          is_favorite?: boolean
          place_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          happened_on?: string
          id?: string
          is_favorite?: boolean
          place_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album_id: string | null
          alt_text: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_favorite: boolean
          memory_id: string | null
          place_id: string | null
          storage_path: string
          tags: string[]
          taken_on: string | null
          title: string | null
        }
        Insert: {
          album_id?: string | null
          alt_text?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          memory_id?: string | null
          place_id?: string | null
          storage_path: string
          tags?: string[]
          taken_on?: string | null
          title?: string | null
        }
        Update: {
          album_id?: string | null
          alt_text?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          memory_id?: string | null
          place_id?: string | null
          storage_path?: string
          tags?: string[]
          taken_on?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          lat: number
          lng: number
          name: string
          visited_on: string | null
          why_special: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          visited_on?: string | null
          why_special?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          visited_on?: string | null
          why_special?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          collaborator_can_edit: boolean
          her_name: string
          hero_photo_path: string | null
          his_name: string
          id: boolean
          reminder_phrase: string | null
          song_url: string | null
          started_at: string | null
          surprise_message: string | null
          timezone: string
          welcome_message: string
        }
        Insert: {
          collaborator_can_edit?: boolean
          her_name?: string
          hero_photo_path?: string | null
          his_name?: string
          id?: boolean
          reminder_phrase?: string | null
          song_url?: string | null
          started_at?: string | null
          surprise_message?: string | null
          timezone?: string
          welcome_message?: string
        }
        Update: {
          collaborator_can_edit?: boolean
          her_name?: string
          hero_photo_path?: string | null
          his_name?: string
          id?: boolean
          reminder_phrase?: string | null
          song_url?: string | null
          started_at?: string | null
          surprise_message?: string | null
          timezone?: string
          welcome_message?: string
        }
        Relationships: []
      }
      special_dates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          kind: string | null
          notes: string | null
          on_date: string
          repeats_yearly: boolean
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string | null
          notes?: string | null
          on_date: string
          repeats_yearly?: boolean
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string | null
          notes?: string | null
          on_date?: string
          repeats_yearly?: boolean
          title?: string
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
      can_edit: { Args: never; Returns: boolean }
      claim_first_admin: { Args: { p_name: string }; Returns: undefined }
      create_invite: {
        Args: { p_role?: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      has_admin: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_member: { Args: never; Returns: boolean }
      redeem_invite: {
        Args: { p_name: string; p_token: string }
        Returns: undefined
      }
      remove_member: { Args: { p_user: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "collaborator"
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
      app_role: ["admin", "collaborator"],
    },
  },
} as const
