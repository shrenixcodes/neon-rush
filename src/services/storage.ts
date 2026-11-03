import { DEFAULT_CHARACTER_ID } from '@/game/data/characters'
import type { GhostEvent } from '@/game/types/replay'

export const SAVE_DATA_VERSION = 2

export interface SaveData {
  version: typeof SAVE_DATA_VERSION
  highScore: number
  totalCoins: number
  unlockedCharacterIds: string[]
  selectedCharacterId: string
  /** Best score per daily-challenge date key (YYYY-MM-DD), kept separate from
   * highScore since the daily challenge is a distinct, seeded mode. */
  dailyBest: Record<string, number>
  /** The action log of the player's best endless run, replayed as a translucent
   * ghost in later runs. Only ever holds one run - the current best. */
  bestGhostRun: GhostEvent[] | null
}

const STORAGE_KEY = 'neon-rush-save'

/** The minimal surface this module needs from Storage, so tests can inject an
 * in-memory fake instead of depending on a real browser localStorage. */
interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    highScore: 0,
    totalCoins: 0,
    unlockedCharacterIds: [DEFAULT_CHARACTER_ID],
    selectedCharacterId: DEFAULT_CHARACTER_ID,
    dailyBest: {},
    bestGhostRun: null,
  }
}

function safeLocalStorage(): StorageLike {
  // Guards against environments where localStorage is unavailable or access itself
  // throws (private browsing in some browsers, certain locked-down iframe embeds),
  // not just where individual reads/writes fail.
  try {
    return window.localStorage
  } catch {
    return { getItem: () => null, setItem: () => undefined }
  }
}

function reviveGhostRun(raw: unknown): GhostEvent[] | null {
  if (!Array.isArray(raw)) return null
  const events = raw.filter(
    (entry): entry is GhostEvent =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as GhostEvent).distance === 'number' &&
      ['lane', 'jump', 'slide'].includes((entry as GhostEvent).type),
  )
  return events.length > 0 ? events : null
}

function reviveDailyBest(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && value >= 0) {
      result[key] = value
    }
  }
  return result
}

/** Validates and backfills a parsed save blob field by field rather than trusting it
 * wholesale - a hand-edited or corrupted localStorage value should degrade to sane
 * defaults for the fields that are wrong, not wipe the whole save. Also doubles as
 * the migration path: a v1 blob (no dailyBest/bestGhostRun yet) comes through the
 * same field-by-field checks and simply picks up this version's defaults for the
 * fields it never had, carrying every field it did have forward untouched. */
function reviveSaveData(raw: unknown): SaveData {
  const fallback = createDefaultSaveData()
  if (!raw || typeof raw !== 'object') return fallback

  const data = raw as Partial<SaveData>
  return {
    version: SAVE_DATA_VERSION,
    highScore:
      typeof data.highScore === 'number' && data.highScore >= 0
        ? data.highScore
        : fallback.highScore,
    totalCoins:
      typeof data.totalCoins === 'number' && data.totalCoins >= 0
        ? data.totalCoins
        : fallback.totalCoins,
    unlockedCharacterIds: Array.isArray(data.unlockedCharacterIds)
      ? data.unlockedCharacterIds.filter((id): id is string => typeof id === 'string')
      : fallback.unlockedCharacterIds,
    selectedCharacterId:
      typeof data.selectedCharacterId === 'string'
        ? data.selectedCharacterId
        : fallback.selectedCharacterId,
    dailyBest: reviveDailyBest(data.dailyBest),
    bestGhostRun: reviveGhostRun(data.bestGhostRun),
  }
}

export function loadSaveData(storage: StorageLike = safeLocalStorage()): SaveData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultSaveData()
    return reviveSaveData(JSON.parse(raw))
  } catch {
    return createDefaultSaveData()
  }
}

export function saveSaveData(data: SaveData, storage: StorageLike = safeLocalStorage()): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded or storage disabled - losing the save silently beats crashing.
  }
}
