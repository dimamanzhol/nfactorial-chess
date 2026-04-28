export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      games: {
        Row: {
          created_at: string
          current_turn: string
          difficulty: string
          elo_updated: boolean
          fen: string
          id: string
          is_ranked: boolean
          player_black: string | null
          player_white: string | null
          room_code: string
          status: string
          time_limit_seconds: number
          updated_at: string
          winner: string | null
        }
        Insert: {
          created_at?: string
          current_turn?: string
          difficulty?: string
          elo_updated?: boolean
          fen?: string
          id?: string
          is_ranked?: boolean
          player_black?: string | null
          player_white?: string | null
          room_code: string
          status?: string
          time_limit_seconds?: number
          updated_at?: string
          winner?: string | null
        }
        Update: {
          created_at?: string
          current_turn?: string
          difficulty?: string
          elo_updated?: boolean
          fen?: string
          id?: string
          is_ranked?: boolean
          player_black?: string | null
          player_white?: string | null
          room_code?: string
          status?: string
          time_limit_seconds?: number
          updated_at?: string
          winner?: string | null
        }
        Relationships: []
      }
      matchmaking: {
        Row: {
          id: string
          player_id: string
          elo: number
          status: string
          game_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          elo?: number
          status?: string
          game_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          elo?: number
          status?: string
          game_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          constraints: string | null
          created_at: string
          description: string
          difficulty: string
          examples: Json
          id: string
          slug: string
          starter_code: Json
          test_cases: Json
          title: string
        }
        Insert: {
          constraints?: string | null
          created_at?: string
          description: string
          difficulty: string
          examples?: Json
          id?: string
          slug: string
          starter_code?: Json
          test_cases?: Json
          title: string
        }
        Update: {
          constraints?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          examples?: Json
          id?: string
          slug?: string
          starter_code?: Json
          test_cases?: Json
          title?: string
        }
        Relationships: []
      }
      turns: {
        Row: {
          code_submitted: string | null
          completed_at: string | null
          game_id: string
          id: string
          language: string | null
          move_attempted: string | null
          move_made: string | null
          player_color: string
          player_id: string | null
          problem_id: string
          solved: boolean | null
          started_at: string
          time_taken_ms: number | null
          turn_number: number
        }
        Insert: {
          code_submitted?: string | null
          completed_at?: string | null
          game_id: string
          id?: string
          language?: string | null
          move_attempted?: string | null
          move_made?: string | null
          player_color: string
          player_id?: string | null
          problem_id: string
          solved?: boolean | null
          started_at?: string
          time_taken_ms?: number | null
          turn_number: number
        }
        Update: {
          code_submitted?: string | null
          completed_at?: string | null
          game_id?: string
          id?: string
          language?: string | null
          move_attempted?: string | null
          move_made?: string | null
          player_color?: string
          player_id?: string | null
          problem_id?: string
          solved?: boolean | null
          started_at?: string
          time_taken_ms?: number | null
          turn_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          is_pro: boolean
          elo: number
          polar_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          is_pro?: boolean
          elo?: number
          polar_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          is_pro?: boolean
          elo?: number
          polar_customer_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          full_name: string | null
          elo: number
          is_pro: boolean
        }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
