export interface GameOverPayload {
  score: number
  distance: number
  coins: number
  isNewHighScore: boolean
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
}

export type GameEventName = keyof GameEventMap
