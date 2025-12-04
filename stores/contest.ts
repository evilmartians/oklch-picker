import { persistentMap } from '@nanostores/persistent'
import { atom } from 'nanostores'

import type { AnyLch } from '../lib/colors.ts'
import {
  fetchAndDecryptEntries,
  getDecryptionKey,
  submitEntryToServer
} from '../lib/contest-api.ts'

export interface ColorData {
  alpha: number
  c: number
  h: number
  l: number
}

export interface ContestEntry {
  contact: string
  guessedColor: ColorData
  name: string
  primerColor: ColorData
  tags?: string[]
  timestamp: number
}

// Legacy schema support (old format without primerColor)
export interface LegacyContestEntry {
  alpha: number
  c: number
  contact: string
  h: number
  l: number
  name: string
  tags?: string[]
  timestamp: number
}

export interface ContestState {
  entries: ContestEntry[]
  pantoneColor?: AnyLch
  tags: string[]
}

export let contest = persistentMap<ContestState>(
  'contest:',
  {
    entries: [],
    tags: []
  },
  {
    decode: JSON.parse,
    encode: JSON.stringify
  }
)

export let showContestForm = atom<boolean>(false)
export let showAdminPanel = atom<boolean>(false)
export let primerColor = atom<AnyLch | null>(null)

// Submission status
export let submitting = atom<boolean>(false)
export let submitError = atom<string | null>(null)
export let currentEntryId = atom<string | null>(null)
export let currentEditToken = atom<string | null>(null)

// Admin state
export let adminPassword = atom<string | null>(null)
export let loadingEntries = atom<boolean>(false)

export async function submitEntry(
  name: string,
  guessedColor: AnyLch,
  contact: string,
  primerColorValue: AnyLch
): Promise<boolean> {
  submitting.set(true)
  submitError.set(null)

  let guessedColorData: ColorData = {
    alpha: guessedColor.alpha ?? 1,
    c: guessedColor.c,
    h: guessedColor.h ?? 0,
    l: guessedColor.l
  }

  let primerColorData: ColorData = {
    alpha: primerColorValue.alpha ?? 1,
    c: primerColorValue.c,
    h: primerColorValue.h ?? 0,
    l: primerColorValue.l
  }

  // Pass existing entry ID and token to update instead of create
  let existingId = currentEntryId.get()
  let existingToken = currentEditToken.get()

  let result = await submitEntryToServer(
    name.trim(),
    contact,
    guessedColorData,
    primerColorData,
    existingId ?? undefined,
    existingToken ?? undefined
  )

  submitting.set(false)

  if (!result.success) {
    submitError.set(result.error || 'Unknown error')
    return false
  }

  // Store the entry ID and edit token for potential updates
  if (result.entryId) {
    currentEntryId.set(result.entryId)
  }
  if (result.editToken) {
    currentEditToken.set(result.editToken)
  }

  return true
}

export function clearCurrentEntry(): void {
  currentEntryId.set(null)
  currentEditToken.set(null)
}

// Load entries from server (admin only)
export async function loadServerEntries(): Promise<void> {
  loadingEntries.set(true)

  try {
    let decryptionKey = getDecryptionKey()
    let entries = await fetchAndDecryptEntries(decryptionKey)

    let state = contest.get()
    contest.set({
      ...state,
      entries
    })
  } catch (e) {
    console.error('Failed to load entries:', e)
  } finally {
    loadingEntries.set(false)
  }
}

export function setPantoneColor(color: AnyLch): void {
  let state = contest.get()
  contest.set({
    ...state,
    pantoneColor: color
  })
}

export function resetContest(): void {
  contest.set({
    entries: [],
    tags: []
  })
}

// ============================================================================
// TAG MANAGEMENT
// ============================================================================

/**
 * Create a new tag
 */
export function createTag(tagName: string): void {
  let state = contest.get()
  let trimmedTag = tagName.trim()

  if (!trimmedTag) return
  if (state.tags.includes(trimmedTag)) return

  contest.set({
    ...state,
    tags: [...state.tags, trimmedTag].sort()
  })
}

/**
 * Delete a tag and remove it from all entries
 */
export function deleteTag(tagName: string): void {
  let state = contest.get()

  contest.set({
    ...state,
    tags: state.tags.filter(t => t !== tagName),
    entries: state.entries.map(entry => ({
      ...entry,
      tags: entry.tags?.filter(t => t !== tagName)
    }))
  })
}

/**
 * Rename a tag across all entries
 */
export function renameTag(oldName: string, newName: string): void {
  let state = contest.get()
  let trimmedNew = newName.trim()

  if (!trimmedNew || oldName === trimmedNew) return
  if (state.tags.includes(trimmedNew)) return

  contest.set({
    ...state,
    tags: state.tags.map(t => t === oldName ? trimmedNew : t).sort(),
    entries: state.entries.map(entry => ({
      ...entry,
      tags: entry.tags?.map(t => t === oldName ? trimmedNew : t)
    }))
  })
}

/**
 * Add tags to specific entries by timestamp
 */
export function addTagsToEntries(timestamps: number[], tags: string[]): void {
  let state = contest.get()

  contest.set({
    ...state,
    entries: state.entries.map(entry => {
      if (!timestamps.includes(entry.timestamp)) return entry

      let currentTags = entry.tags || []
      let newTags = [...new Set([...currentTags, ...tags])].sort()

      return { ...entry, tags: newTags }
    })
  })
}

/**
 * Remove tags from specific entries by timestamp
 */
export function removeTagsFromEntries(timestamps: number[], tags: string[]): void {
  let state = contest.get()

  contest.set({
    ...state,
    entries: state.entries.map(entry => {
      if (!timestamps.includes(entry.timestamp)) return entry

      let newTags = (entry.tags || []).filter(t => !tags.includes(t))

      return { ...entry, tags: newTags.length > 0 ? newTags : undefined }
    })
  })
}

/**
 * Filter entries by tags (returns entries that have ANY of the specified tags)
 */
export function filterEntriesByTags(tags: string[]): ContestEntry[] {
  if (tags.length === 0) return contest.get().entries

  return contest.get().entries.filter(entry =>
    entry.tags?.some(tag => tags.includes(tag))
  )
}

/**
 * Filter entries by tags (returns entries that have ALL of the specified tags)
 */
export function filterEntriesByAllTags(tags: string[]): ContestEntry[] {
  if (tags.length === 0) return contest.get().entries

  return contest.get().entries.filter(entry =>
    tags.every(tag => entry.tags?.includes(tag))
  )
}

/**
 * Get all entries without any tags
 */
export function getUntaggedEntries(): ContestEntry[] {
  return contest.get().entries.filter(entry => !entry.tags || entry.tags.length === 0)
}

/**
 * Get tag usage statistics
 */
export function getTagStats(): Map<string, number> {
  let state = contest.get()
  let stats = new Map<string, number>()

  state.entries.forEach(entry => {
    entry.tags?.forEach(tag => {
      stats.set(tag, (stats.get(tag) || 0) + 1)
    })
  })

  return stats
}

// ============================================================================
// IMPORT/EXPORT WITH DUAL SCHEMA SUPPORT
// ============================================================================

/**
 * Normalize legacy entry to current schema
 */
function normalizeLegacyEntry(legacy: LegacyContestEntry): ContestEntry {
  return {
    name: legacy.name,
    contact: legacy.contact,
    timestamp: legacy.timestamp,
    tags: legacy.tags,
    primerColor: {
      l: 0.5,
      c: 0,
      h: 0,
      alpha: 1
    },
    guessedColor: {
      l: legacy.l,
      c: legacy.c,
      h: legacy.h,
      alpha: legacy.alpha
    }
  }
}

/**
 * Detect if an entry is using legacy schema
 */
function isLegacyEntry(entry: any): entry is LegacyContestEntry {
  return (
    typeof entry.l === 'number' &&
    typeof entry.c === 'number' &&
    typeof entry.h === 'number' &&
    typeof entry.alpha === 'number' &&
    !entry.guessedColor &&
    !entry.primerColor
  )
}

/**
 * Import entries from JSON (supports both schemas)
 */
export function importEntries(jsonData: string): { success: boolean; count: number; error?: string } {
  try {
    let data = JSON.parse(jsonData)
    let entries: any[] = Array.isArray(data) ? data : [data]

    let state = contest.get()
    let normalizedEntries: ContestEntry[] = entries.map(entry => {
      if (isLegacyEntry(entry)) {
        return normalizeLegacyEntry(entry)
      }
      return entry as ContestEntry
    })

    // Extract all tags from imported entries
    let importedTags = new Set<string>()
    normalizedEntries.forEach(entry => {
      entry.tags?.forEach(tag => importedTags.add(tag))
    })

    contest.set({
      ...state,
      entries: [...state.entries, ...normalizedEntries],
      tags: [...new Set([...state.tags, ...importedTags])].sort()
    })

    return { success: true, count: normalizedEntries.length }
  } catch (error) {
    return { success: false, count: 0, error: String(error) }
  }
}

/**
 * Export entries to JSON (current schema with tags)
 */
export function exportEntries(includeTagsInExport: boolean = true): string {
  let state = contest.get()
  let exportData = includeTagsInExport
    ? state.entries
    : state.entries.map(({ tags, ...entry }) => entry)

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export filtered entries by tags
 */
export function exportEntriesByTags(tags: string[]): string {
  let filtered = filterEntriesByTags(tags)
  return JSON.stringify(filtered, null, 2)
}

/**
 * Replace all entries (useful for loading saved data)
 */
export function replaceAllEntries(jsonData: string): { success: boolean; count: number; error?: string } {
  try {
    let data = JSON.parse(jsonData)
    let entries: any[] = Array.isArray(data) ? data : [data]

    let normalizedEntries: ContestEntry[] = entries.map(entry => {
      if (isLegacyEntry(entry)) {
        return normalizeLegacyEntry(entry)
      }
      return entry as ContestEntry
    })

    // Extract all tags
    let allTags = new Set<string>()
    normalizedEntries.forEach(entry => {
      entry.tags?.forEach(tag => allTags.add(tag))
    })

    contest.set({
      ...contest.get(),
      entries: normalizedEntries,
      tags: Array.from(allTags).sort()
    })

    return { success: true, count: normalizedEntries.length }
  } catch (error) {
    return { success: false, count: 0, error: String(error) }
  }
}
