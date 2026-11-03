/**
 * All audio in Neon Rush is synthesized at runtime with the Web Audio API rather
 * than bundled as sound files - there are no licensed or third-party audio assets
 * anywhere in this project. A single shared instance is used by both the React UI
 * (button clicks, screen transitions) and Phaser gameplay code (jump, slide, coin,
 * collision, game-over), since both need the same volume/mute state and the same
 * underlying AudioContext.
 *
 * Browsers block audio until a user gesture occurs, so the context is created lazily
 * and resumed from unlock(), which the app calls on the first pointer/key event.
 */
class AudioManager {
  private context: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private musicStep = 0

  private musicVolume = 0.7
  private sfxVolume = 0.8
  private muted = false

  setVolumes(musicVolume: number, sfxVolume: number, muted: boolean): void {
    this.musicVolume = musicVolume
    this.sfxVolume = sfxVolume
    this.muted = muted
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : musicVolume
    if (this.sfxGain) this.sfxGain.gain.value = muted ? 0 : sfxVolume
  }

  /** Must be called from inside a real user-gesture event handler. */
  unlock(): void {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume()
      return
    }

    const ctx = new AudioContext()
    this.context = ctx

    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = this.muted ? 0 : this.musicVolume
    this.musicGain.connect(ctx.destination)

    this.sfxGain = ctx.createGain()
    this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume
    this.sfxGain.connect(ctx.destination)

    this.startMusic()
  }

  playJump(): void {
    this.sweep(220, 520, 0.14, 'triangle')
  }

  playSlide(): void {
    this.sweep(300, 120, 0.16, 'sawtooth', 0.12)
  }

  playCoin(): void {
    this.blip(880, 0.07, 'square')
    this.blip(1320, 0.09, 'square', 0.05)
  }

  playNearMiss(): void {
    this.sweep(500, 900, 0.1, 'sine', 0.06)
  }

  playCollision(): void {
    this.noiseBurst(0.3)
    this.sweep(180, 60, 0.3, 'sawtooth')
  }

  playGameOver(): void {
    this.blip(440, 0.18, 'sine')
    this.blip(330, 0.22, 'sine', 0.16)
    this.blip(220, 0.3, 'sine', 0.32)
  }

  playUiClick(): void {
    this.blip(600, 0.05, 'square', 0, 0.05)
  }

  private startMusic(): void {
    if (!this.context || this.musicTimer) return
    const stepMs = 260
    const pattern = [196, 196, 233, 196, 311, 233, 196, 174]

    this.musicTimer = setInterval(() => {
      const freq = pattern[this.musicStep % pattern.length]
      this.musicStep++
      this.blip(freq, stepMs / 1000, 'triangle', 0, 0.045, this.musicGain)
    }, stepMs)
  }

  private sweep(
    fromFreq: number,
    toFreq: number,
    duration: number,
    type: OscillatorType,
    peakGain = 0.1,
  ): void {
    const ctx = this.context
    if (!ctx || !this.sfxGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(fromFreq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(toFreq, 1), ctx.currentTime + duration)
    gain.gain.setValueAtTime(peakGain, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  private blip(
    freq: number,
    duration: number,
    type: OscillatorType,
    delay = 0,
    peakGain = 0.12,
    destination: GainNode | null = this.sfxGain,
  ): void {
    const ctx = this.context
    const target = destination
    if (!ctx || !target) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const startTime = ctx.currentTime + delay
    gain.gain.setValueAtTime(peakGain, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(target)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  private noiseBurst(duration: number): void {
    const ctx = this.context
    if (!ctx || !this.sfxGain) return

    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 0.18
    source.connect(gain)
    gain.connect(this.sfxGain)
    source.start()
  }
}

export const audioManager = new AudioManager()
