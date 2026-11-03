export interface CharacterPalette {
  primary: string
  secondary: string
  glow: string
  visor: string
}

export interface CharacterDefinition {
  id: string
  name: string
  tagline: string
  unlockCost: number
  palette: CharacterPalette
}

// The default runner is always unlocked. Every other character is a cosmetic-only
// palette/silhouette variant unlocked with coins earned during runs.
export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'cyber-runner',
    name: 'Cyber Runner',
    tagline: 'The original courier of the neon sprawl.',
    unlockCost: 0,
    palette: { primary: '#27f3ff', secondary: '#0b0618', glow: '#27f3ff', visor: '#ffffff' },
  },
  {
    id: 'neon-ninja',
    name: 'Neon Ninja',
    tagline: 'Moves through the city like static on a screen.',
    unlockCost: 500,
    palette: { primary: '#ff2bd6', secondary: '#1d1236', glow: '#ff2bd6', visor: '#27f3ff' },
  },
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    tagline: 'Rebuilt from salvage, faster than the law allows.',
    unlockCost: 1200,
    palette: { primary: '#fbe84c', secondary: '#140b26', glow: '#fbe84c', visor: '#ff2bd6' },
  },
  {
    id: 'shadow-runner',
    name: 'Shadow Runner',
    tagline: 'Seen only in the gap between streetlights.',
    unlockCost: 2000,
    palette: { primary: '#3b6bff', secondary: '#05020d', glow: '#3b6bff', visor: '#9b30ff' },
  },
  {
    id: 'hologram',
    name: 'Hologram',
    tagline: 'A projection that learned to outrun its source.',
    unlockCost: 3000,
    palette: { primary: '#9b30ff', secondary: '#0b0618', glow: '#9b30ff', visor: '#ffffff' },
  },
  {
    id: 'street-racer',
    name: 'Street Racer',
    tagline: 'Traded wheels for legs and never looked back.',
    unlockCost: 4200,
    palette: { primary: '#ff5a1f', secondary: '#1d1236', glow: '#ff5a1f', visor: '#27f3ff' },
  },
]

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id
