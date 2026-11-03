export interface GameSettings {
  musicVolume: number
  sfxVolume: number
  muted: boolean
  reducedMotion: boolean
  quality: 'high' | 'low'
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  muted: false,
  reducedMotion: false,
  quality: 'high',
}
