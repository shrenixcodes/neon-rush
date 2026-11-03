import type { GhostEvent } from '@/game/types/replay'

export type GameMode = 'endless' | 'daily'

export interface GameOverPayload {
  score: number
  distance: number
  coins: number
  mode: GameMode
  /** Only meaningful for endless runs; always false for a daily challenge attempt. */
  isNewHighScore: boolean
  /** Only meaningful for daily challenge runs; always false for an endless run. */
  isNewDailyBest: boolean
  /** The action log of this run, present only when it just became the new endless
   * best - that's the one run future sessions will replay as a ghost. */
  ghostEvents?: GhostEvent[]
}

export interface ComboPayload {
  multiplier: number
  streak: number
}

export interface NearMissPayload {
  bonus: number
}

// The full event contract shared between Phaser (emitter) and React (listener).
// Keeping this in one place means both sides stay in sync without guessing string keys.
export interface GameEventMap {
  'score-changed': number
  'distance-changed': number
  'coins-changed': number
  'combo-changed': ComboPayload
  'near-miss': NearMissPayload
  'player-collided': void
  'game-ready': void
  'game-started': void
  'game-paused': void
  'game-resumed': void
  'game-over': GameOverPayload
  // Commands flow the other direction: React asks, GameScene decides and then
  // confirms back with the corresponding 'game-paused' / 'game-resumed' event.
  'pause-requested': void
  'resume-requested': void
  'restart-requested': void
  // Fired by the on-screen touch buttons (see TouchControls), so a tap drives the
  // exact same gameplay methods a keyboard press or swipe does.
  'touch-move-left': void
  'touch-move-right': void
  'touch-jump': void
  'touch-slide': void
}

export type GameEventName = keyof GameEventMap
