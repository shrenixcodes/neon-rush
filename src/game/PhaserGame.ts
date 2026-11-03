import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameConfig'
import { BootScene } from '@/game/scenes/BootScene'
import { PreloadScene } from '@/game/scenes/PreloadScene'
import { GameScene } from '@/game/scenes/GameScene'

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#05020d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, PreloadScene, GameScene],
  })
}
