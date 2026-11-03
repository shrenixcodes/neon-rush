// A ghost run is stored as the small list of actions that produced it, keyed by the
// world-distance at which each one happened - not a per-frame recording. Since both
// the live run and a replay advance through the same distance-based difficulty
// curve, replaying "do X once distance reaches N" stays in sync regardless of frame
// rate, and the stored payload stays tiny (dozens of entries, not thousands).
export interface GhostEvent {
  distance: number
  type: 'lane' | 'jump' | 'slide'
  lane?: number
}
