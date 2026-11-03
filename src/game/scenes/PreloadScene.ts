import Phaser from 'phaser'
import { GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

const ROAD_TILE_HEIGHT = 256

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create(): void {
    this.generateRoadTexture()
    this.generateObstacleTextures()
    this.generateCoinTexture()
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

  // Each obstacle type gets a distinct silhouette and color so the required
  // avoidance action (jump, slide, or lane dodge) is readable at a glance.
  private generateObstacleTextures(): void {
    this.drawBarrier()
    this.drawHazard()
    this.drawLaser()
    this.drawVehicle()
    this.drawEnergyWall()
    this.drawDrone()
  }

  private drawBarrier(): void {
    const g = this.add.graphics()
    const w = 140
    const h = 140
    g.fillStyle(0x3b1e66, 1)
    g.fillRoundedRect(10, 20, w - 20, h - 20, 10)
    g.lineStyle(5, 0xff2bd6, 0.9)
    g.strokeRoundedRect(10, 20, w - 20, h - 20, 10)
    g.lineStyle(3, 0xff2bd6, 0.5)
    for (let i = 1; i < 4; i++) {
      const y = 20 + ((h - 20) / 4) * i
      g.beginPath()
      g.moveTo(14, y)
      g.lineTo(w - 14, y)
      g.strokePath()
    }
    g.generateTexture('obstacle-barrier', w, h)
    g.destroy()
  }

  private drawHazard(): void {
    const g = this.add.graphics()
    const w = 140
    const h = 90
    g.fillStyle(0x3a0d0d, 1)
    g.fillRect(0, h - 30, w, 30)
    g.fillStyle(0xff5a1f, 1)
    for (const cx of [26, 70, 114]) {
      g.fillTriangle(cx - 20, h - 28, cx + 20, h - 28, cx, h - 80)
    }
    g.lineStyle(2, 0xffb27a, 0.8)
    for (const cx of [26, 70, 114]) {
      g.strokeTriangle(cx - 20, h - 28, cx + 20, h - 28, cx, h - 80)
    }
    g.generateTexture('obstacle-hazard', w, h)
    g.destroy()
  }

  private drawLaser(): void {
    const g = this.add.graphics()
    const w = 140
    const h = 70
    g.fillStyle(0x0b0618, 0)
    g.fillRect(0, 0, w, h)
    g.fillStyle(0x27f3ff, 0.25)
    g.fillRect(0, h * 0.35, w, h * 0.3)
    g.fillStyle(0x27f3ff, 0.9)
    g.fillRect(0, h * 0.46, w, h * 0.08)
    g.fillStyle(0xffffff, 0.9)
    g.fillRect(0, h * 0.48, w, h * 0.04)
    for (const x of [8, w - 16]) {
      g.fillStyle(0x140b26, 1)
      g.fillRect(x, h * 0.3, 8, h * 0.4)
    }
    g.generateTexture('obstacle-laser', w, h)
    g.destroy()
  }

  private drawVehicle(): void {
    const g = this.add.graphics()
    const w = 150
    const h = 220
    g.fillStyle(0x1d1236, 1)
    g.fillRoundedRect(15, 10, w - 30, h - 20, 18)
    g.fillStyle(0xfbe84c, 1)
    g.fillRoundedRect(28, 28, w - 56, h * 0.42, 12)
    g.lineStyle(4, 0xfbe84c, 0.9)
    g.strokeRoundedRect(15, 10, w - 30, h - 20, 18)
    g.fillStyle(0x27f3ff, 0.85)
    g.fillRect(34, h * 0.56, w - 68, 10)
    g.fillRect(34, h * 0.68, w - 68, 10)
    g.generateTexture('obstacle-vehicle', w, h)
    g.destroy()
  }

  private drawEnergyWall(): void {
    const g = this.add.graphics()
    const w = 150
    const h = 240
    g.fillStyle(0x3b6bff, 0.22)
    g.fillRoundedRect(10, 5, w - 20, h - 10, 16)
    g.lineStyle(5, 0x3b6bff, 0.95)
    g.strokeRoundedRect(10, 5, w - 20, h - 10, 16)
    g.lineStyle(2, 0x9b30ff, 0.7)
    for (let i = 1; i < 6; i++) {
      const y = (h / 6) * i
      g.beginPath()
      g.moveTo(14, y)
      g.lineTo(w - 14, y)
      g.strokePath()
    }
    g.generateTexture('obstacle-wall', w, h)
    g.destroy()
  }

  private drawDrone(): void {
    const g = this.add.graphics()
    const size = 110
    const cx = size / 2
    const cy = size / 2
    g.fillStyle(0x2b0b0b, 1)
    g.fillCircle(cx, cy, 34)
    g.lineStyle(4, 0xff2bd6, 0.9)
    g.strokeCircle(cx, cy, 34)
    g.fillStyle(0xff2bd6, 0.9)
    g.fillCircle(cx, cy, 10)
    g.fillStyle(0x27f3ff, 0.6)
    g.fillRect(4, cy - 4, size - 8, 8)
    g.generateTexture('obstacle-drone', size, size)
    g.destroy()
  }

  private generateCoinTexture(): void {
    const g = this.add.graphics()
    const size = 56
    const cx = size / 2
    const cy = size / 2
    g.fillStyle(0xfbe84c, 0.25)
    g.fillCircle(cx, cy, size / 2)
    g.fillStyle(0xfbe84c, 1)
    g.fillCircle(cx, cy, size / 2 - 8)
    g.lineStyle(3, 0xffffff, 0.9)
    g.strokeCircle(cx, cy, size / 2 - 8)
    g.fillStyle(0xffffff, 0.85)
    g.fillCircle(cx, cy, 6)
    g.generateTexture('coin', size, size)
    g.destroy()
  }
}
