import Phaser from 'phaser'

export interface InputHandlers {
  onMoveLeft: () => void
  onMoveRight: () => void
  onJump: () => void
  onSlide: () => void
  onPause: () => void
}

const KEY_BINDINGS: Record<keyof InputHandlers, string[]> = {
  onMoveLeft: ['LEFT', 'A'],
  onMoveRight: ['RIGHT', 'D'],
  onJump: ['SPACE', 'UP', 'W'],
  onSlide: ['DOWN', 'S'],
  onPause: ['ESC'],
}

/**
 * Translates raw keydown events into abstract game actions. Each action is bound to
 * every key listed for it, so a lane change responds the same way whether the player
 * uses the arrow keys or WASD.
 */
export class InputManager {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin
  private readonly boundHandlers: Array<{ event: string; fn: () => void }> = []

  constructor(scene: Phaser.Scene, handlers: InputHandlers) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard input plugin is not available on this scene')
    }
    this.keyboard = scene.input.keyboard

    for (const [action, keys] of Object.entries(KEY_BINDINGS) as Array<
      [keyof InputHandlers, string[]]
    >) {
      const handler = handlers[action]
      for (const key of keys) {
        const eventName = `keydown-${key}`
        this.keyboard.on(eventName, handler)
        this.boundHandlers.push({ event: eventName, fn: handler })
      }
    }
  }

  destroy(): void {
    for (const { event, fn } of this.boundHandlers) {
      this.keyboard.off(event, fn)
    }
    this.boundHandlers.length = 0
  }
}
