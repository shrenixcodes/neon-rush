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

/** Minimum travel, in pixels, before a touch drag counts as a directional swipe
 * rather than an incidental tap or jitter. */
const SWIPE_THRESHOLD = 30

/**
 * Translates raw input into abstract game actions, from two independent sources:
 * keyboard keydown events (desktop) and single-finger swipe gestures captured via
 * Phaser's pointer events (touch). Both sources drive the exact same handlers, so
 * a swipe and the matching key always have identical gameplay effect.
 */
export class InputManager {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin
  private readonly scene: Phaser.Scene
  private readonly boundHandlers: Array<{ event: string; fn: () => void }> = []
  private readonly handlers: InputHandlers

  private swipeStartX = 0
  private swipeStartY = 0
  private swipeActive = false

  constructor(scene: Phaser.Scene, handlers: InputHandlers) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard input plugin is not available on this scene')
    }
    this.scene = scene
    this.keyboard = scene.input.keyboard
    this.handlers = handlers

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

    scene.input.on('pointerdown', this.onPointerDown, this)
    scene.input.on('pointerup', this.onPointerUp, this)
  }

  private onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    this.swipeStartX = pointer.x
    this.swipeStartY = pointer.y
    this.swipeActive = true
  }

  private onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.swipeActive) return
    this.swipeActive = false

    const dx = pointer.x - this.swipeStartX
    const dy = pointer.y - this.swipeStartY
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) this.handlers.onMoveRight()
      else this.handlers.onMoveLeft()
    } else {
      if (dy > 0) this.handlers.onSlide()
      else this.handlers.onJump()
    }
  }

  destroy(): void {
    for (const { event, fn } of this.boundHandlers) {
      this.keyboard.off(event, fn)
    }
    this.boundHandlers.length = 0
    this.scene.input.off('pointerdown', this.onPointerDown, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
  }
}
