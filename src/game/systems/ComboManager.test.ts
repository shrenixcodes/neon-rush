import { describe, expect, it } from 'vitest'
import { ComboManager } from './ComboManager'

describe('ComboManager', () => {
  it('starts at multiplier 1 with no streak', () => {
    const combo = new ComboManager()
    expect(combo.getState()).toEqual({ multiplier: 1, streak: 0 })
  })

  it('raises the multiplier every 3 consecutive pickups', () => {
    const combo = new ComboManager()
    for (let i = 0; i < 3; i++) combo.registerPickup()
    expect(combo.getState().multiplier).toBe(1.5)

    for (let i = 0; i < 3; i++) combo.registerPickup()
    expect(combo.getState().multiplier).toBe(2)
  })

  it('caps the multiplier at the configured maximum', () => {
    const combo = new ComboManager()
    for (let i = 0; i < 60; i++) combo.registerPickup()
    expect(combo.getState().multiplier).toBeLessThanOrEqual(4)
  })

  it('resets the streak once the pickup window lapses', () => {
    const combo = new ComboManager()
    combo.registerPickup()
    combo.registerPickup()
    combo.update(1000)
    expect(combo.getState().streak).toBe(2)

    combo.update(1500) // total 2500ms since last pickup, past the 2200ms window
    expect(combo.getState()).toEqual({ multiplier: 1, streak: 0 })
  })

  it('resets immediately on an explicit reset (e.g. a collision)', () => {
    const combo = new ComboManager()
    combo.registerPickup()
    combo.registerPickup()
    combo.reset()
    expect(combo.getState()).toEqual({ multiplier: 1, streak: 0 })
  })
})
