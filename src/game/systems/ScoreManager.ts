const DISTANCE_POINTS_PER_PIXEL = 0.05
const BASE_COIN_VALUE = 10
const NEAR_MISS_BONUS = 25

/**
 * Owns the final score formula (distance points + coin bonus + near-miss bonus) as a
 * small, dependency-free class so it can be driven directly from Vitest without a
 * Phaser scene. Distance and coins are tracked separately because the game-over and
 * HUD screens both need to show them independently of the combined score.
 */
export class ScoreManager {
  private distancePixels = 0
  private coinsCollected = 0
  private bonusPoints = 0

  addDistance(pixels: number): void {
    this.distancePixels += pixels
  }

  addCoin(multiplier: number): number {
    this.coinsCollected += 1
    const value = Math.round(BASE_COIN_VALUE * multiplier)
    this.bonusPoints += value
    return value
  }

  addNearMissBonus(): number {
    this.bonusPoints += NEAR_MISS_BONUS
    return NEAR_MISS_BONUS
  }

  getDistanceMeters(): number {
    return Math.floor(this.distancePixels / 10)
  }

  getCoins(): number {
    return this.coinsCollected
  }

  getScore(): number {
    return Math.floor(this.distancePixels * DISTANCE_POINTS_PER_PIXEL) + this.bonusPoints
  }
}
