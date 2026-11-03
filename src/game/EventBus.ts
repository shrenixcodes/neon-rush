import Phaser from 'phaser'
import type { GameEventMap } from '@/game/types/events'

// A single long-lived emitter shared by every Phaser scene and the React UI layer.
// Phaser emits gameplay facts (score, coins, game over, ...); React emits commands
// (pause, resume, restart). Neither side holds a reference to the other's internals,
// which keeps gameplay state out of React's render cycle entirely.
class TypedEventBus extends Phaser.Events.EventEmitter {
  emit<K extends keyof GameEventMap>(
    event: K,
    ...args: GameEventMap[K] extends void ? [] : [GameEventMap[K]]
  ): boolean {
    return super.emit(event as string, ...args)
  }

  on<K extends keyof GameEventMap>(
    event: K,
    fn: (payload: GameEventMap[K]) => void,
    context?: unknown,
  ): this {
    return super.on(event as string, fn, context)
  }

  off<K extends keyof GameEventMap>(
    event: K,
    fn?: (payload: GameEventMap[K]) => void,
    context?: unknown,
  ): this {
    return super.off(event as string, fn, context)
  }
}

export const EventBus = new TypedEventBus()
