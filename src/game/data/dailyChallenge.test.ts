import { describe, expect, it } from 'vitest'
import { createDailyChallengeRng, createSeededRng, getDailyChallengeKey } from './dailyChallenge'

describe('getDailyChallengeKey', () => {
  it('formats a date as a zero-padded YYYY-MM-DD key', () => {
    expect(getDailyChallengeKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(getDailyChallengeKey(new Date(2026, 10, 23))).toBe('2026-11-23')
  })
})

describe('createSeededRng', () => {
  it('produces the exact same sequence for the same seed', () => {
    const a = createSeededRng(42)
    const b = createSeededRng(42)
    const sequenceA = Array.from({ length: 10 }, () => a())
    const sequenceB = Array.from({ length: 10 }, () => b())
    expect(sequenceA).toEqual(sequenceB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = createSeededRng(1)
    const b = createSeededRng(2)
    const sequenceA = Array.from({ length: 10 }, () => a())
    const sequenceB = Array.from({ length: 10 }, () => b())
    expect(sequenceA).not.toEqual(sequenceB)
  })

  it('always returns values in [0, 1)', () => {
    const rng = createSeededRng(12345)
    for (let i = 0; i < 200; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('createDailyChallengeRng', () => {
  it('gives every player on the same calendar day the same sequence', () => {
    const morning = createDailyChallengeRng(new Date(2026, 10, 3, 6, 0))
    const night = createDailyChallengeRng(new Date(2026, 10, 3, 23, 0))
    const sequenceA = Array.from({ length: 10 }, () => morning())
    const sequenceB = Array.from({ length: 10 }, () => night())
    expect(sequenceA).toEqual(sequenceB)
  })

  it('gives different days different sequences', () => {
    const today = createDailyChallengeRng(new Date(2026, 10, 3))
    const tomorrow = createDailyChallengeRng(new Date(2026, 10, 4))
    const sequenceA = Array.from({ length: 10 }, () => today())
    const sequenceB = Array.from({ length: 10 }, () => tomorrow())
    expect(sequenceA).not.toEqual(sequenceB)
  })
})
