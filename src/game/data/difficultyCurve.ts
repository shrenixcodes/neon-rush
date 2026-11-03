import { BASE_SCROLL_SPEED } from '@/game/config/gameConfig'

export interface DifficultyBreakpoint {
  /** Distance (in world pixels travelled) at which this breakpoint takes full effect. */
  distance: number
  scrollSpeed: number
  /** Minimum world-space gap between obstacle waves, in pixels. */
  obstacleGap: number
  /** Highest pattern tier unlocked at this point (see data/obstacles.ts). */
  patternTier: number
}

// Speed and spawn gap both move gradually (interpolated between breakpoints rather
// than stepping), so difficulty ramps up smoothly instead of lurching. Harder pattern
// tiers unlock at fixed distance thresholds instead of interpolating, since a tier is
// a discrete set of layouts rather than a continuous value.
export const DIFFICULTY_CURVE: DifficultyBreakpoint[] = [
  { distance: 0, scrollSpeed: BASE_SCROLL_SPEED, obstacleGap: 620, patternTier: 0 },
  { distance: 2500, scrollSpeed: 560, obstacleGap: 560, patternTier: 1 },
  { distance: 6000, scrollSpeed: 650, obstacleGap: 500, patternTier: 2 },
  { distance: 12000, scrollSpeed: 740, obstacleGap: 460, patternTier: 3 },
  { distance: 20000, scrollSpeed: 820, obstacleGap: 430, patternTier: 3 },
  { distance: 32000, scrollSpeed: 900, obstacleGap: 410, patternTier: 3 },
]
