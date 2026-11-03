export interface EnvironmentDefinition {
  id: string
  name: string
  skyTop: number
  skyBottom: number
  buildingFar: number
  buildingNear: number
  windowColor: number
  accentColor: number
}

// Four visually distinct city sections the run cycles through by distance (see
// getEnvironmentAt in ParallaxBackground). Each only changes the color palette and
// building silhouette of the scrolling skyline - gameplay is identical in every
// section, so a transition never interrupts or changes the difficulty of a run.
export const ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: 'neon-downtown',
    name: 'Neon Downtown',
    skyTop: 0x1d1236,
    skyBottom: 0x05020d,
    buildingFar: 0x1a0f33,
    buildingNear: 0x2a1750,
    windowColor: 0x27f3ff,
    accentColor: 0xff2bd6,
  },
  {
    id: 'cyberpunk-market',
    name: 'Cyberpunk Market',
    skyTop: 0x2a0f2e,
    skyBottom: 0x0b0618,
    buildingFar: 0x331022,
    buildingNear: 0x4a1733,
    windowColor: 0xfbe84c,
    accentColor: 0xff5a1f,
  },
  {
    id: 'industrial-district',
    name: 'Industrial District',
    skyTop: 0x101a24,
    skyBottom: 0x05020d,
    buildingFar: 0x121e28,
    buildingNear: 0x1c2e3c,
    windowColor: 0x3b6bff,
    accentColor: 0x27f3ff,
  },
  {
    id: 'futuristic-highway',
    name: 'Futuristic Highway',
    skyTop: 0x150b2e,
    skyBottom: 0x05020d,
    buildingFar: 0x1c1038,
    buildingNear: 0x2e1a52,
    windowColor: 0x9b30ff,
    accentColor: 0x27f3ff,
  },
]
