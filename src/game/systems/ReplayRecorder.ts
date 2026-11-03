import type { GhostEvent } from '@/game/types/replay'

/**
 * Captures the current run's actions as a compact, distance-keyed event log (see
 * game/types/replay.ts for why distance rather than wall-clock time). Only the
 * actions that actually took effect should be recorded - a jump pressed while
 * already airborne never happened as far as the ghost is concerned.
 */
export class ReplayRecorder {
  private readonly events: GhostEvent[] = []

  recordLaneChange(distance: number, lane: number): void {
    this.events.push({ distance, type: 'lane', lane })
  }

  recordJump(distance: number): void {
    this.events.push({ distance, type: 'jump' })
  }

  recordSlide(distance: number): void {
    this.events.push({ distance, type: 'slide' })
  }

  getEvents(): GhostEvent[] {
    return this.events
  }
}
