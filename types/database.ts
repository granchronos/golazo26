export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC'
export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'
export type MatchRound =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_finals'
  | 'semi_finals'
  | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          code: string
          flag_emoji: string
          confederation: Confederation
          group_letter: GroupLetter
          eliminated_round: MatchRound | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          flag_emoji: string
          confederation: Confederation
          group_letter: GroupLetter
          eliminated_round?: MatchRound | null
          created_at?: string
        }
        Update: {
          eliminated_round?: MatchRound | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          round: MatchRound
          match_number: number
          home_team_id: string | null
          away_team_id: string | null
          match_date: string
          venue: string
          city: string
          home_score: number | null
          away_score: number | null
          winner_id: string | null
          status: MatchStatus
          created_at: string
        }
        Insert: {
          id?: string
          round: MatchRound
          match_number: number
          home_team_id?: string | null
          away_team_id?: string | null
          match_date: string
          venue: string
          city: string
          home_score?: number | null
          away_score?: number | null
          winner_id?: string | null
          status?: MatchStatus
          created_at?: string
        }
        Update: {
          home_team_id?: string | null
          away_team_id?: string | null
          home_score?: number | null
          away_score?: number | null
          winner_id?: string | null
          status?: MatchStatus
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          room_id: string
          match_id: string
          predicted_winner_id: string
          predicted_home_score: number | null
          predicted_away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room_id: string
          match_id: string
          predicted_winner_id: string
          predicted_home_score?: number | null
          predicted_away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          predicted_winner_id?: string
          predicted_home_score?: number | null
          predicted_away_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      group_predictions: {
        Row: {
          id: string
          user_id: string
          room_id: string
          group_letter: GroupLetter
          team_1st_id: string
          team_2nd_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room_id: string
          group_letter: GroupLetter
          team_1st_id: string
          team_2nd_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          team_1st_id?: string
          team_2nd_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          code: string
          invite_slug: string
          admin_id: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          code: string
          invite_slug: string
          admin_id: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          admin_id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          user_id: string
          room_id: string
          total_points: number
          group_points: number
          knockout_points: number
          correct_predictions: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room_id: string
          total_points?: number
          group_points?: number
          knockout_points?: number
          correct_predictions?: number
          updated_at?: string
        }
        Update: {
          total_points?: number
          group_points?: number
          knockout_points?: number
          correct_predictions?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          name: string
          avatar_url: string | null
          total_points: number
          correct_predictions: number
          rank: number
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_scores: {
        Args: { match_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type GroupPrediction = Database['public']['Tables']['group_predictions']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomMember = Database['public']['Tables']['room_members']['Row']
export type Score = Database['public']['Tables']['scores']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']
