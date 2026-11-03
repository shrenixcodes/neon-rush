// Internal render resolution. A tall aspect ratio suits a lane runner on both mobile
// (native portrait) and desktop (centered, letterboxed window) without perspective math.
export const GAME_WIDTH = 720
export const GAME_HEIGHT = 1280

// The road doesn't fill the full canvas width - the margins on either side are
// where ParallaxBackground renders the scrolling city skyline, which is what gives
// the run a sense of place beyond the three lanes themselves.
export const ROAD_MARGIN = 50
export const ROAD_WIDTH = GAME_WIDTH - ROAD_MARGIN * 2

export const LANE_COUNT = 3
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT
export const LANE_X: readonly [number, number, number] = [
  ROAD_MARGIN + LANE_WIDTH * 0.5,
  ROAD_MARGIN + LANE_WIDTH * 1.5,
  ROAD_MARGIN + LANE_WIDTH * 2.5,
]

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
