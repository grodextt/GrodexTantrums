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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_ips: {
        Row: {
          created_at: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          ip_address?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_unlocks: {
        Row: {
          chapter_id: string
          expires_at: string | null
          id: string
          unlock_type: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          expires_at?: string | null
          id?: string
          unlock_type?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          expires_at?: string | null
          id?: string
          unlock_type?: string | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_unlocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_unlocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          auto_free_days: number | null
          coin_price: number | null
          created_at: string
          free_release_at: string | null
          id: string
          manga_id: string
          number: number
          pages: string[] | null
          premium: boolean | null
          title: string | null
        }
        Insert: {
          auto_free_days?: number | null
          coin_price?: number | null
          created_at?: string
          free_release_at?: string | null
          id?: string
          manga_id: string
          number: number
          pages?: string[] | null
          premium?: boolean | null
          title?: string | null
        }
        Update: {
          auto_free_days?: number | null
          coin_price?: number | null
          created_at?: string
          free_release_at?: string | null
          id?: string
          manga_id?: string
          number?: number
          pages?: string[] | null
          premium?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          chapter_id: string | null
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          manga_id: string
          parent_id: string | null
          text: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          manga_id: string
          parent_id?: string | null
          text: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          manga_id?: string
          parent_id?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      manga: {
        Row: {
          alt_titles: string[] | null
          artist: string
          author: string
          banner_url: string | null
          bookmarks: number | null
          content_warnings: string[] | null
          cover_url: string
          created_at: string
          description: string
          featured: boolean | null
          genres: string[] | null
          id: string
          pinned: boolean | null
          premium: boolean | null
          rating: number | null
          released: number
          slug: string
          status: string
          title: string
          trending: boolean | null
          type: string
          updated_at: string
          views: number | null
        }
        Insert: {
          alt_titles?: string[] | null
          artist?: string
          author?: string
          banner_url?: string | null
          bookmarks?: number | null
          content_warnings?: string[] | null
          cover_url?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          genres?: string[] | null
          id?: string
          pinned?: boolean | null
          premium?: boolean | null
          rating?: number | null
          released?: number
          slug: string
          status?: string
          title: string
          trending?: boolean | null
          type?: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          alt_titles?: string[] | null
          artist?: string
          author?: string
          banner_url?: string | null
          bookmarks?: number | null
          content_warnings?: string[] | null
          cover_url?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          genres?: string[] | null
          id?: string
          pinned?: boolean | null
          premium?: boolean | null
          rating?: number | null
          released?: number
          slug?: string
          status?: string
          title?: string
          trending?: boolean | null
          type?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      manga_discord_settings: {
        Row: {
          channel_name: string | null
          manga_id: string
          notification_template: string | null
          primary_role_id: string | null
          secondary_role_id: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          channel_name?: string | null
          manga_id: string
          notification_template?: string | null
          primary_role_id?: string | null
          secondary_role_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          channel_name?: string | null
          manga_id?: string
          notification_template?: string | null
          primary_role_id?: string | null
          secondary_role_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manga_discord_settings_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: true
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      manga_subscriptions: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manga_subscriptions_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_awards: {
        Row: {
          amount: number
          awarded_at: string
          id: string
          mission_type: string
          user_id: string
        }
        Insert: {
          amount: number
          awarded_at?: string
          id?: string
          mission_type: string
          user_id: string
        }
        Update: {
          amount?: number
          awarded_at?: string
          id?: string
          mission_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          chapter_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_premium: boolean | null
          is_read: boolean | null
          manga_id: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          is_read?: boolean | null
          manga_id?: string | null
          message?: string
          title?: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          is_read?: boolean | null
          manga_id?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coin_balance: number | null
          consecutive_comment_days: number | null
          created_at: string
          display_name: string | null
          id: string
          last_comment_at: string | null
          token_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coin_balance?: number | null
          consecutive_comment_days?: number | null
          created_at?: string
          display_name?: string | null
          id: string
          last_comment_at?: string | null
          token_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coin_balance?: number | null
          consecutive_comment_days?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_comment_at?: string | null
          token_balance?: number | null
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          chapter_id: string
          chapter_number: number
          id: string
          manga_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          chapter_number: number
          id?: string
          manga_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          chapter_number?: number
          id?: string
          manga_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_checkins: {
        Row: {
          checked_in_at: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          preferences?: Json
          updated_at?: string
          user_id?: string
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
      chapters_public: {
        Row: {
          auto_free_days: number | null
          coin_price: number | null
          created_at: string | null
          free_release_at: string | null
          id: string | null
          manga_id: string | null
          number: number | null
          premium: boolean | null
          title: string | null
        }
        Insert: {
          auto_free_days?: number | null
          coin_price?: number | null
          created_at?: string | null
          free_release_at?: string | null
          id?: string | null
          manga_id?: string | null
          number?: number | null
          premium?: boolean | null
          title?: string | null
        }
        Update: {
          auto_free_days?: number | null
          coin_price?: number | null
          created_at?: string | null
          free_release_at?: string | null
          id?: string | null
          manga_id?: string | null
          number?: number | null
          premium?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_set_user_balance: {
        Args: {
          p_coin_balance: number
          p_target_user_id: string
          p_token_balance: number
        }
        Returns: undefined
      }
      can_user_checkin: { Args: { p_user_id: string }; Returns: boolean }
      get_chapter_pages: { Args: { p_chapter_id: string }; Returns: string[] }
      handle_auto_free_chapters: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_token_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      is_ip_blocked: { Args: { p_ip: string }; Returns: boolean }
      secure_increment_tokens: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      unlock_chapter_with_coins: {
        Args: { p_chapter_id: string; p_user_id: string }
        Returns: Json
      }
      unlock_chapter_with_token: {
        Args: { p_chapter_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type: "chapter_update" | "comment_reply"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      notification_type: ["chapter_update", "comment_reply"],
    },
  },
} as const
