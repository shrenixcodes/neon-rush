import Phaser from 'phaser'
import { Coin } from '@/game/entities/Coin'
import type { Obstacle } from '@/game/entities/Obstacle'
import { GAME_HEIGHT, LANE_X } from '@/game/config/gameConfig'

const POOL_SIZE = 24
const RUN_LENGTH = 4
const RUN_SPACING = 90
const BASE_GAP = 340
const SPAWN_Y = -160
const DESPAWN_MARGIN = 160
/** How close (in world pixels) an obstacle can be to a candidate coin lane/row before
 * that lane is skipped for this run, so coins don't stack on unreachable obstacles. */
const OBSTACLE_PROXIMITY_GUARD = 220

export class CoinSpawner {
  private readonly pool: Coin[]
  private readonly active = new Set<Coin>()
  private readonly rng: () => number
  private distanceSinceLastRun = 0

  constructor(scene: Phaser.Scene, rng: () => number = Math.random) {
    this.rng = rng
    this.pool = Array.from({ length: POOL_SIZE }, () => new Coin(scene))
  }

  update(
    delta: number,
    distanceDeltaPixels: number,
    scrollSpeed: number,
    activeObstacles: ReadonlySet<Obstacle>,
  ): void {
    this.distanceSinceLastRun += distanceDeltaPixels
    if (this.distanceSinceLastRun >= BASE_GAP) {
      this.distanceSinceLastRun -= BASE_GAP
      this.spawnRun(scrollSpeed, activeObstacles)
    }

    for (const coin of this.active) {
      coin.update(0, delta)
      coin.setScrollSpeed(scrollSpeed)
      if (coin.y > GAME_HEIGHT + DESPAWN_MARGIN) {
        this.despawn(coin)
      }
    }
  }

  getActive(): ReadonlySet<Coin> {
    return this.active
  }

  /** Immediately removes a collected coin rather than waiting for it to scroll past
   * the despawn margin, so it disappears the instant the player picks it up. */
  collect(coin: Coin): void {
    this.despawn(coin)
  }

  reset(): void {
    for (const coin of Array.from(this.active)) {
      this.despawn(coin)
    }
    this.distanceSinceLastRun = 0
  }

  private spawnRun(scrollSpeed: number, activeObstacles: ReadonlySet<Obstacle>): void {
    const lane = this.pickLane(activeObstacles)
    if (lane === null) return

    for (let i = 0; i < RUN_LENGTH; i++) {
      const coin = this.acquire()
      if (!coin) return
      coin.spawn(LANE_X[lane], SPAWN_Y - i * RUN_SPACING, scrollSpeed)
      this.active.add(coin)
    }
  }

  /** Prefers a lane with no obstacle currently near the spawn point. Falls back to
   * null (skip this run) only if every lane is blocked, which is rare by design since
   * obstacle patterns always leave at least one lane clear or share one action. */
  private pickLane(activeObstacles: ReadonlySet<Obstacle>): number | null {
    const laneOrder = [0, 1, 2].sort(() => this.rng() - 0.5)
    for (const lane of laneOrder) {
      const blocked = Array.from(activeObstacles).some(
        (o) => o.laneIndex === lane && Math.abs(o.y - SPAWN_Y) < OBSTACLE_PROXIMITY_GUARD,
      )
      if (!blocked) return lane
    }
    return null
  }

  private acquire(): Coin | undefined {
    return this.pool.find((c) => !this.active.has(c))
  }

  private despawn(coin: Coin): void {
    coin.deactivate()
    this.active.delete(coin)
  }
}
