export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      breaks: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          created_by: string
          date: string
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          date: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          id: string
          sender: string
          timestamp: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          id?: string
          sender: string
          timestamp?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          id?: string
          sender?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      daily_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          date: string
          id: string
          is_important: boolean | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          date: string
          id?: string
          is_important?: boolean | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
          is_important?: boolean | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      game_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          room_id: string | null
          sender: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string | null
          created_by: string
          game: string
          id: string
          max_players: number | null
          name: string
          players: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          game: string
          id?: string
          max_players?: number | null
          name: string
          players?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          game?: string
          id?: string
          max_players?: number | null
          name?: string
          players?: string[] | null
        }
        Relationships: []
      }
      happy_time_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          expiry_date: string
          id: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          expiry_date: string
          id?: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_time_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      important_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          note_id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          note_id: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          note_id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "important_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "daily_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      important_resources: {
        Row: {
          added_at: string | null
          added_by: string
          file_url: string | null
          id: string
          notes: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          added_at?: string | null
          added_by: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          date: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          date: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      question_bundles: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          question_count: number
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          question_count?: number
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          question_count?: number
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          bundle_id: string | null
          correct_answer: string
          created_at: string | null
          created_by: string
          id: string
          options: string[] | null
          order_index: number | null
          question: string
          subject: string | null
          type: string
        }
        Insert: {
          bundle_id?: string | null
          correct_answer: string
          created_at?: string | null
          created_by: string
          id?: string
          options?: string[] | null
          order_index?: number | null
          question: string
          subject?: string | null
          type: string
        }
        Update: {
          bundle_id?: string | null
          correct_answer?: string
          created_at?: string | null
          created_by?: string
          id?: string
          options?: string[] | null
          order_index?: number | null
          question?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "question_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_files: {
        Row: {
          id: string
          name: string
          size: number
          type: string
          uploaded_at: string | null
          uploaded_by: string
          url: string
        }
        Insert: {
          id?: string
          name: string
          size: number
          type: string
          uploaded_at?: string | null
          uploaded_by: string
          url: string
        }
        Update: {
          id?: string
          name?: string
          size?: number
          type?: string
          uploaded_at?: string | null
          uploaded_by?: string
          url?: string
        }
        Relationships: []
      }
      study_links: {
        Row: {
          added_at: string | null
          added_by: string
          description: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          description?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          description?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          task_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          task_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "todo_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          id: string
          sender: string
          sender_name: string
          team_id: string
          timestamp: string | null
        }
        Insert: {
          content: string
          id?: string
          sender: string
          sender_name: string
          team_id: string
          timestamp?: string | null
        }
        Update: {
          content?: string
          id?: string
          sender?: string
          sender_name?: string
          team_id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          is_private: boolean | null
          members: string[] | null
          name: string
          notes: string | null
          owner: string | null
          subjects: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          members?: string[] | null
          name: string
          notes?: string | null
          owner?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          members?: string[] | null
          name?: string
          notes?: string | null
          owner?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          color: string | null
          created_at: string | null
          day: string
          end_time: string
          id: string
          room: string | null
          start_time: string
          subject: string
          teacher: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          day: string
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          subject: string
          teacher?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          day?: string
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          subject?: string
          teacher?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      todo_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          id: string
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          class_code: string
          created_at: string | null
          display_name: string
          id: string
          password: string
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          class_code: string
          created_at?: string | null
          display_name: string
          id?: string
          password: string
          role: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          class_code?: string
          created_at?: string | null
          display_name?: string
          id?: string
          password?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_calendar_events_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_daily_notes_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_game_messages_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_game_rooms_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_happy_time_tasks_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_important_notes_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_subjects_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_task_comments_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_teams_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_todo_tasks_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
