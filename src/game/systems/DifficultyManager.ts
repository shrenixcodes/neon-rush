import { DIFFICULTY_CURVE } from '@/game/data/difficultyCurve'

export interface DifficultySnapshot {
  scrollSpeed: number
  obstacleGap: number
  patternTier: number
}

/**
 * A pure function of distance travelled - no internal state, no side effects, which
 * makes it trivial to unit test and to reason about independently of the render loop.
 * Speed and spawn gap are linearly interpolated between the two breakpoints the
 * current distance falls between, so the ramp feels continuous rather than stepped.
 */
export function getDifficultyAt(distance: number): DifficultySnapshot {
  const curve = DIFFICULTY_CURVE
  if (distance <= curve[0].distance) {
    return pick(curve[0])
  }

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i]
    const next = curve[i + 1]
    if (distance >= current.distance && distance < next.distance) {
      const t = (distance - current.distance) / (next.distance - current.distance)
      return {
        scrollSpeed: lerp(current.scrollSpeed, next.scrollSpeed, t),
        obstacleGap: lerp(current.obstacleGap, next.obstacleGap, t),
        patternTier: current.patternTier,
      }
    }
  }

  return pick(curve[curve.length - 1])
}

function pick(breakpoint: (typeof DIFFICULTY_CURVE)[number]): DifficultySnapshot {
  return {
    scrollSpeed: breakpoint.scrollSpeed,
    obstacleGap: breakpoint.obstacleGap,
    patternTier: breakpoint.patternTier,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
