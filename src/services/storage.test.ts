import { describe, expect, it } from 'vitest'
import { createDefaultSaveData, loadSaveData, saveSaveData } from './storage'
import { DEFAULT_CHARACTER_ID } from '@/game/data/characters'

function createFakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  }
}

describe('loadSaveData', () => {
  it('returns default data when storage is empty', () => {
    const storage = createFakeStorage()
    expect(loadSaveData(storage)).toEqual(createDefaultSaveData())
  })

  it('returns default data when the stored value is not valid JSON', () => {
    const storage = createFakeStorage({ 'neon-rush-save': 'not json {{{' })
    expect(loadSaveData(storage)).toEqual(createDefaultSaveData())
  })

  it('returns default data when the stored value is a JSON primitive, not an object', () => {
    const storage = createFakeStorage({ 'neon-rush-save': '42' })
    expect(loadSaveData(storage)).toEqual(createDefaultSaveData())
  })

  it('round-trips a valid save written by saveSaveData', () => {
    const storage = createFakeStorage()
    const data = {
      version: 1 as const,
      highScore: 5000,
      totalCoins: 1200,
      unlockedCharacterIds: [DEFAULT_CHARACTER_ID, 'neon-ninja'],
      selectedCharacterId: 'neon-ninja',
    }
    saveSaveData(data, storage)
    expect(loadSaveData(storage)).toEqual(data)
  })

  it('backfills individual fields that are the wrong type instead of discarding the whole save', () => {
    const storage = createFakeStorage({
      'neon-rush-save': JSON.stringify({
        version: 1,
        highScore: 'not-a-number',
        totalCoins: 300,
        unlockedCharacterIds: 'not-an-array',
        selectedCharacterId: 'neon-ninja',
      }),
    })

    const result = loadSaveData(storage)
    expect(result.highScore).toBe(0)
    expect(result.totalCoins).toBe(300)
    expect(result.unlockedCharacterIds).toEqual([DEFAULT_CHARACTER_ID])
    expect(result.selectedCharacterId).toBe('neon-ninja')
  })

  it('drops non-string entries out of unlockedCharacterIds', () => {
    const storage = createFakeStorage({
      'neon-rush-save': JSON.stringify({
        version: 1,
        highScore: 10,
        totalCoins: 10,
        unlockedCharacterIds: [DEFAULT_CHARACTER_ID, 42, null, 'neon-ninja'],
        selectedCharacterId: DEFAULT_CHARACTER_ID,
      }),
    })

    expect(loadSaveData(storage).unlockedCharacterIds).toEqual([DEFAULT_CHARACTER_ID, 'neon-ninja'])
  })
})
