// An obstacle's requiredAction determines the single rule the collision system uses
// to decide whether an overlap counts as a hit:
//   'jump'  - avoided if the player is jumping at the moment of overlap
//   'slide' - avoided if the player is sliding at the moment of overlap
//   'dodge' - never avoided by jumping or sliding; only a different lane clears it
export type ObstacleAction = 'jump' | 'slide' | 'dodge'

export interface ObstacleDefinition {
  id: string
  requiredAction: ObstacleAction
  textureKey: string
  displayWidth: number
  displayHeight: number
  hitboxWidth: number
  hitboxHeight: number
  moves?: boolean
}

export const OBSTACLE_DEFINITIONS: Record<string, ObstacleDefinition> = {
  barrier: {
    id: 'barrier',
    requiredAction: 'jump',
    textureKey: 'obstacle-barrier',
    displayWidth: 140,
    displayHeight: 140,
    hitboxWidth: 120,
    hitboxHeight: 110,
  },
  hazard: {
    id: 'hazard',
    requiredAction: 'jump',
    textureKey: 'obstacle-hazard',
    displayWidth: 140,
    displayHeight: 90,
    hitboxWidth: 120,
    hitboxHeight: 60,
  },
  laser: {
    id: 'laser',
    requiredAction: 'slide',
    textureKey: 'obstacle-laser',
    displayWidth: 140,
    displayHeight: 70,
    hitboxWidth: 130,
    hitboxHeight: 40,
  },
  vehicle: {
    id: 'vehicle',
    requiredAction: 'dodge',
    textureKey: 'obstacle-vehicle',
    displayWidth: 150,
    displayHeight: 220,
    hitboxWidth: 130,
    hitboxHeight: 200,
  },
  energyWall: {
    id: 'energyWall',
    requiredAction: 'dodge',
    textureKey: 'obstacle-wall',
    displayWidth: 150,
    displayHeight: 240,
    hitboxWidth: 140,
    hitboxHeight: 220,
  },
  drone: {
    id: 'drone',
    requiredAction: 'dodge',
    textureKey: 'obstacle-drone',
    displayWidth: 110,
    displayHeight: 110,
    hitboxWidth: 90,
    hitboxHeight: 90,
    moves: true,
  },
}

export type LaneSlot = { lane: number; obstacleId: string } | null

export interface ObstaclePattern {
  tier: number
  /** Index 0-2 maps to a lane; null means that lane is left clear. */
  lanes: [LaneSlot, LaneSlot, LaneSlot]
}

// Every pattern is authored so that the player always has at least one safe
// response available - either a shared action across all occupied lanes, or one
// lane deliberately left clear. Lane assignments are rotated at spawn time so the
// same template doesn't always occupy the same physical lanes.
export const OBSTACLE_PATTERNS: ObstaclePattern[] = [
  { tier: 0, lanes: [{ lane: 0, obstacleId: 'barrier' }, null, null] },
  { tier: 0, lanes: [{ lane: 0, obstacleId: 'laser' }, null, null] },
  { tier: 0, lanes: [{ lane: 0, obstacleId: 'vehicle' }, null, null] },
  { tier: 0, lanes: [{ lane: 0, obstacleId: 'hazard' }, null, null] },

  {
    tier: 1,
    lanes: [{ lane: 0, obstacleId: 'barrier' }, { lane: 1, obstacleId: 'barrier' }, null],
  },
  { tier: 1, lanes: [{ lane: 0, obstacleId: 'laser' }, { lane: 1, obstacleId: 'laser' }, null] },
  {
    tier: 1,
    lanes: [{ lane: 0, obstacleId: 'energyWall' }, { lane: 1, obstacleId: 'energyWall' }, null],
  },

  {
    tier: 2,
    lanes: [
      { lane: 0, obstacleId: 'barrier' },
      { lane: 1, obstacleId: 'barrier' },
      { lane: 2, obstacleId: 'barrier' },
    ],
  },
  {
    tier: 2,
    lanes: [
      { lane: 0, obstacleId: 'laser' },
      { lane: 1, obstacleId: 'laser' },
      { lane: 2, obstacleId: 'laser' },
    ],
  },

  {
    tier: 2,
    lanes: [{ lane: 0, obstacleId: 'vehicle' }, { lane: 1, obstacleId: 'barrier' }, null],
  },
  {
    tier: 2,
    lanes: [null, { lane: 1, obstacleId: 'energyWall' }, { lane: 2, obstacleId: 'laser' }],
  },
  {
    tier: 3,
    lanes: [
      { lane: 0, obstacleId: 'hazard' },
      null,
      { lane: 2, obstacleId: 'vehicle' },
    ],
  },

  { tier: 3, lanes: [null, { lane: 1, obstacleId: 'drone' }, null] },
  { tier: 3, lanes: [{ lane: 0, obstacleId: 'drone' }, null, { lane: 2, obstacleId: 'laser' }] },
]
