import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameConfig'
import { BootScene } from '@/game/scenes/BootScene'
import { PreloadScene } from '@/game/scenes/PreloadScene'
import { GameScene } from '@/game/scenes/GameScene'
import type { GameMode } from '@/game/types/events'
import type { GhostEvent } from '@/game/types/replay'

export interface PhaserGameInitData {
  highScore: number
  characterId: string
  mode: GameMode
  dailyBest: number
  ghostEvents: GhostEvent[] | null
}

export function createPhaserGame(parent: HTMLElement, initData: PhaserGameInitData): Phaser.Game {
  const game = new Phaser.Game({
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

  // The registry is Phaser's own cross-scene data store, shared for the lifetime of
  // this Game instance. GameScene reads these on every create() (including after a
  // Restart, which re-runs create() without recreating the Game), so this is the one
  // place initial progression data needs to be handed off from React to Phaser.
  game.registry.set('highScore', initData.highScore)
  game.registry.set('characterId', initData.characterId)
  game.registry.set('mode', initData.mode)
  game.registry.set('dailyBest', initData.dailyBest)
  game.registry.set('ghostEvents', initData.ghostEvents)

  return game
}
