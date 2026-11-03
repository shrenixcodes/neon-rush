import { DEFAULT_CHARACTER_ID } from '@/game/data/characters'

export const SAVE_DATA_VERSION = 1

export interface SaveData {
  version: typeof SAVE_DATA_VERSION
  highScore: number
  totalCoins: number
  unlockedCharacterIds: string[]
  selectedCharacterId: string
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

/** Validates and backfills a parsed save blob field by field rather than trusting it
 * wholesale - a hand-edited or corrupted localStorage value should degrade to sane
 * defaults for the fields that are wrong, not wipe the whole save. */
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
