interface HowToPlayProps {
  onBack: () => void
}

const controls: Array<{ action: string; keyboard: string; touch: string; note: string }> = [
  {
    action: 'Move left',
    keyboard: 'A / Left Arrow',
    touch: 'Swipe left',
    note: 'Switches one lane left.',
  },
  {
    action: 'Move right',
    keyboard: 'D / Right Arrow',
    touch: 'Swipe right',
    note: 'Switches one lane right.',
  },
  {
    action: 'Jump',
    keyboard: 'Space / Up / W',
    touch: 'Swipe up',
    note: 'Clears barriers and ground hazards.',
  },
  {
    action: 'Slide',
    keyboard: 'Down Arrow / S',
    touch: 'Swipe down',
    note: 'Ducks under low lasers.',
  },
  { action: 'Pause', keyboard: 'Esc', touch: 'Pause button', note: 'Freezes the run at any time.' },
]

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-ink-950 px-6 py-10">
      <h2 className="font-display text-glow-cyan text-3xl font-bold text-neon-cyan">How To Play</h2>
      <p className="font-body mt-2 max-w-md text-center text-white/70">
        You run automatically through the neon city. Switch lanes, jump, and slide to survive
        obstacles while collecting coins along the way.
      </p>

      <div className="mt-8 w-full max-w-lg overflow-hidden rounded-lg border border-ink-700">
        <table className="font-body w-full text-left text-sm">
          <thead className="bg-ink-800 text-white/60 uppercase">
            <tr>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Keyboard</th>
              <th className="px-4 py-2">Touch</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((c) => (
              <tr key={c.action} className="border-t border-ink-800 odd:bg-ink-900/40">
                <td className="px-4 py-2 font-semibold text-white">{c.action}</td>
                <td className="px-4 py-2 text-neon-cyan/90">{c.keyboard}</td>
                <td className="px-4 py-2 text-neon-magenta/90">{c.touch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="font-body mt-6 max-w-lg list-disc space-y-1 pl-5 text-left text-sm text-white/60">
        <li>Road barriers and energy walls require a jump or a lane change.</li>
        <li>Low overhead lasers require a slide.</li>
        <li>Moving drones require careful timing rather than a fixed reaction.</li>
        <li>Collecting coins back-to-back builds a combo multiplier.</li>
        <li>Narrowly avoiding an obstacle grants a near-miss bonus.</li>
      </ul>

      <button
        onClick={onBack}
        className="font-display mt-10 rounded-md border border-neon-purple/60 bg-ink-900/60 px-6 py-2.5 font-bold tracking-wide text-neon-purple transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
      >
        Back
      </button>
    </div>
  )
}
