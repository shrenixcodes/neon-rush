import Phaser from 'phaser'
import { GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

const ROAD_TILE_HEIGHT = 256

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create(): void {
    this.generateRoadTexture()
    this.scene.start('Game')
  }

  // The road is a single repeatable tile rendered once with Graphics and reused via a
  // TileSprite. No external art is involved anywhere in the project - every visual is
  // drawn procedurally so the game stays fully self-contained.
  private generateRoadTexture(): void {
    const g = this.add.graphics()
    const laneBoundary1 = (LANE_X[0] + LANE_X[1]) / 2
    const laneBoundary2 = (LANE_X[1] + LANE_X[2]) / 2

    g.fillStyle(0x0b0618, 1)
    g.fillRect(0, 0, GAME_WIDTH, ROAD_TILE_HEIGHT)

    g.fillStyle(0x140b26, 1)
    g.fillRect(0, 0, GAME_WIDTH, 24)
    g.fillRect(0, ROAD_TILE_HEIGHT - 24, GAME_WIDTH, 24)

    g.lineStyle(4, 0x27f3ff, 0.55)
    for (const x of [laneBoundary1, laneBoundary2]) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, ROAD_TILE_HEIGHT * 0.45)
      g.moveTo(x, ROAD_TILE_HEIGHT * 0.6)
      g.lineTo(x, ROAD_TILE_HEIGHT)
      g.strokePath()
    }

    g.lineStyle(3, 0xff2bd6, 0.3)
    g.strokeRect(6, 6, GAME_WIDTH - 12, ROAD_TILE_HEIGHT - 12)

    g.generateTexture('road-tile', GAME_WIDTH, ROAD_TILE_HEIGHT)
    g.destroy()
  }
}
