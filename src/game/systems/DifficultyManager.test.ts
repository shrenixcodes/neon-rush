import { describe, expect, it } from 'vitest'
import { getDifficultyAt } from './DifficultyManager'
import { DIFFICULTY_CURVE } from '@/game/data/difficultyCurve'

describe('getDifficultyAt', () => {
  it('returns the starting breakpoint at distance 0', () => {
    const result = getDifficultyAt(0)
    expect(result).toEqual({
      scrollSpeed: DIFFICULTY_CURVE[0].scrollSpeed,
      obstacleGap: DIFFICULTY_CURVE[0].obstacleGap,
      patternTier: DIFFICULTY_CURVE[0].patternTier,
    })
  })

  it('clamps to the first breakpoint for negative distance', () => {
    const result = getDifficultyAt(-100)
    expect(result.scrollSpeed).toBe(DIFFICULTY_CURVE[0].scrollSpeed)
  })

  it('interpolates speed and gap linearly between two breakpoints', () => {
    const [first, second] = DIFFICULTY_CURVE
    const midpoint = (first.distance + second.distance) / 2
    const result = getDifficultyAt(midpoint)

    expect(result.scrollSpeed).toBeCloseTo((first.scrollSpeed + second.scrollSpeed) / 2, 5)
    expect(result.obstacleGap).toBeCloseTo((first.obstacleGap + second.obstacleGap) / 2, 5)
    expect(result.patternTier).toBe(first.patternTier)
  })

  it('holds the final breakpoint values beyond the last threshold', () => {
    const last = DIFFICULTY_CURVE[DIFFICULTY_CURVE.length - 1]
    const result = getDifficultyAt(last.distance + 100000)

    expect(result).toEqual({
      scrollSpeed: last.scrollSpeed,
      obstacleGap: last.obstacleGap,
      patternTier: last.patternTier,
    })
  })

  it('never decreases scroll speed as distance increases', () => {
    let previousSpeed = 0
    for (let d = 0; d <= 40000; d += 250) {
      const { scrollSpeed } = getDifficultyAt(d)
      expect(scrollSpeed).toBeGreaterThanOrEqual(previousSpeed)
      previousSpeed = scrollSpeed
    }
  })
})
