/** Local calendar date key (YYYY-MM-DD) - the one thing every player attempting
 * "today's" challenge has in common, regardless of timezone-induced UTC skew. */
export function getDailyChallengeKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashStringToSeed(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

/**
 * mulberry32 - a small, fast, deterministic PRNG. Good enough for gameplay variety
 * and nothing more; the point here is reproducibility (the same seed always yields
 * the same sequence), not cryptographic quality.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed
  return function rng() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The RNG that feeds ObstacleSpawner/CoinSpawner for a daily challenge run - same
 * date in, same obstacle/coin sequence out, for every player and every attempt. */
export function createDailyChallengeRng(date: Date = new Date()): () => number {
  return createSeededRng(hashStringToSeed(getDailyChallengeKey(date)))
}
