// Internal render resolution. A tall aspect ratio suits a lane runner on both mobile
// (native portrait) and desktop (centered, letterboxed window) without perspective math.
export const GAME_WIDTH = 720
export const GAME_HEIGHT = 1280

export const LANE_COUNT = 3
export const LANE_X: readonly [number, number, number] = [
  GAME_WIDTH / 6,
  GAME_WIDTH / 2,
  (GAME_WIDTH / 6) * 5,
]
export const LANE_WIDTH = GAME_WIDTH / LANE_COUNT

export const PLAYER_ROW_Y = GAME_HEIGHT - 260
export const PLAYER_WIDTH = 72
export const PLAYER_HEIGHT = 120

export const LANE_SWITCH_MS = 150

export const JUMP_VELOCITY = -980
export const GRAVITY_Y = 2600
export const JUMP_FORWARD_LEAN = 0.08

export const SLIDE_DURATION_MS = 480
export const SLIDE_HEIGHT_SCALE = 0.5

export const BASE_SCROLL_SPEED = 480 // pixels per second at the start of a run
