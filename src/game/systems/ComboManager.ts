const COMBO_WINDOW_MS = 2200
const STREAK_PER_MULTIPLIER_STEP = 3
const MULTIPLIER_STEP = 0.5
const MAX_MULTIPLIER = 4

export interface ComboState {
  multiplier: number
  streak: number
}

/**
 * Tracks consecutive coin pickups. Each pickup inside the rolling window raises the
 * streak; the multiplier is derived from the streak rather than stored separately so
 * the two can never drift out of sync. A collision or letting the window lapse resets
 * both - deliberately harsh, since the multiplier is meant to reward sustained runs
 * of pickups rather than occasional lucky coins.
 */
export class ComboManager {
  private streak = 0
  private msSinceLastPickup = 0
  private hasPickedUpOnce = false

  registerPickup(): ComboState {
    this.streak += 1
    this.msSinceLastPickup = 0
    this.hasPickedUpOnce = true
    return this.getState()
  }

  reset(): ComboState {
    this.streak = 0
    this.msSinceLastPickup = 0
    return this.getState()
  }

  update(deltaMs: number): ComboState | null {
    if (!this.hasPickedUpOnce || this.streak === 0) return null

    this.msSinceLastPickup += deltaMs
    if (this.msSinceLastPickup > COMBO_WINDOW_MS) {
      return this.reset()
    }
    return null
  }

  getState(): ComboState {
    const multiplier = Math.min(
      1 + Math.floor(this.streak / STREAK_PER_MULTIPLIER_STEP) * MULTIPLIER_STEP,
      MAX_MULTIPLIER,
    )
    return { multiplier, streak: this.streak }
  }
}
