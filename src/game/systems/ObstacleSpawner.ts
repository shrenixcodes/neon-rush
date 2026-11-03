import Phaser from 'phaser'
import { Obstacle } from '@/game/entities/Obstacle'
import { OBSTACLE_DEFINITIONS, OBSTACLE_PATTERNS } from '@/game/data/obstacles'
import { GAME_HEIGHT, LANE_COUNT, LANE_X } from '@/game/config/gameConfig'

const POOL_SIZE = 18
const SPAWN_Y = -140
const DESPAWN_MARGIN = 160

/**
 * Spawns obstacle "waves" at a distance-based cadence rather than a fixed timer, so
 * spacing stays visually consistent even as scroll speed changes with difficulty.
 * Patterns are pre-authored and lane-rotated at spawn time (see data/obstacles.ts)
 * rather than generated ad hoc, which is what guarantees every wave is fair by
 * construction instead of needing a runtime solver to prove it.
 */
export class ObstacleSpawner {
  private readonly pool: Obstacle[]
  private readonly active = new Set<Obstacle>()
  private readonly rng: () => number
  private distanceSinceLastWave = 0

  constructor(scene: Phaser.Scene, rng: () => number = Math.random) {
    this.rng = rng
    this.pool = Array.from({ length: POOL_SIZE }, () => new Obstacle(scene))
  }

  update(delta: number, distanceDeltaPixels: number, scrollSpeed: number, patternTier: number, gap: number): void {
    this.distanceSinceLastWave += distanceDeltaPixels
    while (this.distanceSinceLastWave >= gap) {
      this.distanceSinceLastWave -= gap
      this.spawnWave(patternTier, scrollSpeed)
    }

    for (const obstacle of this.active) {
      obstacle.update(0, delta)
      obstacle.setScrollSpeed(scrollSpeed)
      if (obstacle.y > GAME_HEIGHT + DESPAWN_MARGIN) {
        this.despawn(obstacle)
      }
    }
  }

  getActive(): ReadonlySet<Obstacle> {
    return this.active
  }

  reset(): void {
    for (const obstacle of Array.from(this.active)) {
      this.despawn(obstacle)
    }
    this.distanceSinceLastWave = 0
  }

  private spawnWave(patternTier: number, scrollSpeed: number): void {
    const eligible = OBSTACLE_PATTERNS.filter((p) => p.tier <= patternTier)
    const pattern = eligible[Math.floor(this.rng() * eligible.length)]
    const rotation = Math.floor(this.rng() * LANE_COUNT)
    const mirror = this.rng() < 0.5

    for (const slot of pattern.lanes) {
      if (!slot) continue

      let lane = (slot.lane + rotation) % LANE_COUNT
      if (mirror) lane = LANE_COUNT - 1 - lane

      const definition = OBSTACLE_DEFINITIONS[slot.obstacleId]
      const obstacle = this.acquire()
      if (!obstacle) continue
      obstacle.spawn(definition, lane, LANE_X[lane], SPAWN_Y, scrollSpeed)
      this.active.add(obstacle)
    }
  }

  private acquire(): Obstacle | undefined {
    const obstacle = this.pool.find((o) => !this.active.has(o))
    return obstacle
  }

  private despawn(obstacle: Obstacle): void {
    obstacle.deactivate()
    this.active.delete(obstacle)
  }
}
