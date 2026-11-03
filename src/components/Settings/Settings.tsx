import type { GameSettings } from '@/types/settings'

interface SettingsProps {
  settings: GameSettings
  onChange: (next: GameSettings) => void
  onBack: () => void
}

function Slider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <label className="font-body flex flex-col gap-1 text-left text-sm text-white/80">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-neon-cyan">{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-neon-cyan disabled:opacity-40"
      />
    </label>
  )
}

export function Settings({ settings, onChange, onBack }: SettingsProps) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-ink-950 px-6 py-10">
      <h2 className="font-display text-glow-cyan text-3xl font-bold text-neon-cyan">Settings</h2>

      <div className="mt-8 w-full max-w-sm space-y-5 rounded-lg border border-ink-700 bg-ink-900/40 p-6">
        <label className="font-body flex items-center justify-between text-sm text-white/80">
          <span>Mute All Audio</span>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(e) => onChange({ ...settings, muted: e.target.checked })}
            className="accent-neon-magenta h-4 w-4"
          />
        </label>

        <Slider
          label="Music Volume"
          value={settings.musicVolume}
          disabled={settings.muted}
          onChange={(v) => onChange({ ...settings, musicVolume: v })}
        />
        <Slider
          label="Sound Effects"
          value={settings.sfxVolume}
          disabled={settings.muted}
          onChange={(v) => onChange({ ...settings, sfxVolume: v })}
        />

        <label className="font-body flex items-center justify-between text-sm text-white/80">
          <span>Reduce Motion Effects</span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => onChange({ ...settings, reducedMotion: e.target.checked })}
            className="accent-neon-purple h-4 w-4"
          />
        </label>

        <label className="font-body flex items-center justify-between text-sm text-white/80">
          <span>Visual Quality</span>
          <select
            value={settings.quality}
            onChange={(e) =>
              onChange({ ...settings, quality: e.target.value as GameSettings['quality'] })
            }
            className="font-body rounded border border-ink-700 bg-ink-800 px-2 py-1 text-sm text-white"
          >
            <option value="high">High</option>
            <option value="low">Low (better performance)</option>
          </select>
        </label>
      </div>

      <button
        onClick={onBack}
        className="font-display mt-10 rounded-md border border-neon-purple/60 bg-ink-900/60 px-6 py-2.5 font-bold tracking-wide text-neon-purple transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
      >
        Back
      </button>
    </div>
  )
}
