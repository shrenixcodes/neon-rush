import type { GameEventMap } from '@/game/types/events'

type Listener<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void

/**
 * A single long-lived emitter shared by every Phaser scene and the React UI layer.
 * Phaser emits gameplay facts (score, coins, game over, ...); React emits commands
 * (pause, resume, restart). Neither side holds a reference to the other's internals,
 * which keeps gameplay state out of React's render cycle entirely.
 *
 * This is a small hand-rolled emitter rather than Phaser's own EventEmitter on
 * purpose: EventBus is imported eagerly by the React UI (the main menu, HUD, and
 * settings all listen for events before a run ever starts), and `import Phaser from
 * 'phaser'` pulls the entire engine into that eager bundle. Since this bus conceptually
 * has nothing to do with Phaser - it's a neutral pub/sub channel - depending on it
 * was both unnecessary and, as this cost makes clear, actively counterproductive for
 * the code-splitting that keeps Phaser out of the initial page load.
 */
class TypedEventBus {
  private readonly listeners = new Map<keyof GameEventMap, Set<Listener<never>>>()

  emit<K extends keyof GameEventMap>(
    event: K,
    ...args: GameEventMap[K] extends void ? [] : [GameEventMap[K]]
  ): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const fn of set) {
      ;(fn as Listener<K>)(args[0] as GameEventMap[K])
    }
  }

  on<K extends keyof GameEventMap>(event: K, fn: Listener<K>): void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(fn as Listener<never>)
  }

  off<K extends keyof GameEventMap>(event: K, fn: Listener<K>): void {
    this.listeners.get(event)?.delete(fn as Listener<never>)
  }
}

export const EventBus = new TypedEventBus()
