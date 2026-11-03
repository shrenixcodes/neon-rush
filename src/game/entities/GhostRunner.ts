import type Phaser from 'phaser'
import { Player } from '@/game/entities/Player'
import { LaneController } from '@/game/systems/LaneController'
import type { CharacterPalette } from '@/game/data/characters'
import type { GhostEvent } from '@/game/types/replay'
import { LANE_X } from '@/game/config/gameConfig'

const GHOST_ALPHA = 0.32

/**
 * A translucent, non-colliding replay of the player's best previous run. It's a real
 * second Player instance (reusing all of its run/jump/slide posing) with its physics
 * body disabled so it never participates in collision or coin-pickup checks, fed
 * recorded actions instead of live input as the run's distance catches up to each
 * recorded event's distance.
 */
export class GhostRunner {
  readonly player: Player
  private readonly laneController: LaneController
  private readonly events: GhostEvent[]
  private nextEventIndex = 0

  constructor(scene: Phaser.Scene, events: GhostEvent[], palette: CharacterPalette) {
    this.events = events
    this.player = new Player(scene, LANE_X[1], palette)
    this.player.setAlpha(GHOST_ALPHA)
    this.player.body.enable = false
    this.laneController = new LaneController(scene, this.player)
  }

  update(time: number, delta: number, distance: number): void {
    while (
      this.nextEventIndex < this.events.length &&
      this.events[this.nextEventIndex].distance <= distance
    ) {
      this.applyEvent(this.events[this.nextEventIndex])
      this.nextEventIndex++
    }
    this.player.update(time, delta)
  }

  private applyEvent(event: GhostEvent): void {
    if (event.type === 'jump') {
      this.player.jump()
    } else if (event.type === 'slide') {
      this.player.slide()
    } else if (event.type === 'lane' && typeof event.lane === 'number') {
      const current = this.laneController.getCurrentLane()
      if (event.lane > current) this.laneController.moveRight()
      else if (event.lane < current) this.laneController.moveLeft()
    }
  }

  destroy(): void {
    this.player.destroy()
  }
}
