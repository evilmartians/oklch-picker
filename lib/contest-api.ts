import type { ColorData, ContestEntry } from '../stores/contest.ts'
import { decryptField, encryptFields } from './crypto.ts'
import { supabase, type DbContestEntry, type DbContestEntryInsert } from './supabase.ts'

// Encryption key for public submissions
// This provides a layer of obfuscation - real protection is RLS preventing reads
const SUBMISSION_KEY = 'contest-2026-oklch-picker'

export interface SubmitResult {
  success: boolean
  error?: string
}

export async function submitEntryToServer(
  name: string,
  contact: string,
  guessedColor: ColorData,
  primerColor: ColorData
): Promise<SubmitResult> {
  try {
    // Encrypt PII
    let { encrypted, salt } = await encryptFields(
      { name, contact },
      SUBMISSION_KEY
    )

    let entry: DbContestEntryInsert = {
      encrypted_name: encrypted.name,
      encrypted_contact: encrypted.contact,
      guessed_color_l: guessedColor.l,
      guessed_color_c: guessedColor.c,
      guessed_color_h: guessedColor.h,
      guessed_color_alpha: guessedColor.alpha,
      primer_color_l: primerColor.l,
      primer_color_c: primerColor.c,
      primer_color_h: primerColor.h,
      primer_color_alpha: primerColor.alpha,
      salt
    }

    let { error } = await supabase.from('contest_entries').insert(entry)

    if (error) {
      console.error('Supabase insert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('Submit error:', e)
    return { success: false, error: String(e) }
  }
}

export async function fetchAndDecryptEntries(
  decryptionKey: string
): Promise<ContestEntry[]> {
  let { data, error } = await supabase
    .from('contest_entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch error:', error)
    throw new Error(error.message)
  }

  if (!data) return []

  let entries: ContestEntry[] = []

  for (let row of data as DbContestEntry[]) {
    try {
      let name = await decryptField(row.encrypted_name, row.salt, decryptionKey)
      let contact = await decryptField(
        row.encrypted_contact,
        row.salt,
        decryptionKey
      )

      entries.push({
        name,
        contact,
        guessedColor: {
          l: row.guessed_color_l,
          c: row.guessed_color_c,
          h: row.guessed_color_h,
          alpha: row.guessed_color_alpha
        },
        primerColor: {
          l: row.primer_color_l,
          c: row.primer_color_c,
          h: row.primer_color_h,
          alpha: row.primer_color_alpha
        },
        timestamp: new Date(row.created_at).getTime()
      })
    } catch (e) {
      // Decryption failed - wrong key or corrupted data
      console.error('Decryption failed for entry:', row.id, e)
    }
  }

  return entries
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  let { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut()
}

export async function isAuthenticated(): Promise<boolean> {
  let { data } = await supabase.auth.getSession()
  return !!data.session
}

export function getDecryptionKey(): string {
  return SUBMISSION_KEY
}
