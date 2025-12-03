import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DbContestEntry {
  id: string
  encrypted_name: string
  encrypted_contact: string
  guessed_color_l: number
  guessed_color_c: number
  guessed_color_h: number
  guessed_color_alpha: number
  primer_color_l: number
  primer_color_c: number
  primer_color_h: number
  primer_color_alpha: number
  salt: string
  created_at: string
}

export interface DbContestEntryInsert {
  encrypted_name: string
  encrypted_contact: string
  guessed_color_l: number
  guessed_color_c: number
  guessed_color_h: number
  guessed_color_alpha: number
  primer_color_l: number
  primer_color_c: number
  primer_color_h: number
  primer_color_alpha: number
  salt: string
}
