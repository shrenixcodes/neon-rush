import type { CharacterPalette } from '@/game/data/characters'

interface CharacterPreviewProps {
  palette: CharacterPalette
  locked?: boolean
}

// Every character shares the same silhouette; only the palette changes, which keeps
// unlocks purely cosmetic and avoids needing external sprite artwork.
export function CharacterPreview({ palette, locked }: CharacterPreviewProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      className="h-28 w-24"
      style={{ filter: locked ? 'grayscale(0.85) brightness(0.6)' : 'none' }}
    >
      <ellipse cx="50" cy="108" rx="26" ry="6" fill={palette.glow} opacity="0.25" />
      <rect
        x="38"
        y="30"
        width="24"
        height="46"
        rx="10"
        fill={palette.secondary}
        stroke={palette.primary}
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="18"
        r="15"
        fill={palette.secondary}
        stroke={palette.primary}
        strokeWidth="2"
      />
      <rect x="40" y="13" width="20" height="7" rx="3.5" fill={palette.visor} opacity="0.9" />
      <rect x="20" y="36" width="10" height="34" rx="5" fill={palette.primary} opacity="0.85" />
      <rect x="70" y="36" width="10" height="34" rx="5" fill={palette.primary} opacity="0.85" />
      <rect
        x="40"
        y="74"
        width="9"
        height="32"
        rx="4"
        fill={palette.secondary}
        stroke={palette.primary}
        strokeWidth="2"
      />
      <rect
        x="51"
        y="74"
        width="9"
        height="32"
        rx="4"
        fill={palette.secondary}
        stroke={palette.primary}
        strokeWidth="2"
      />
      {!locked && (
        <circle
          cx="50"
          cy="48"
          r="26"
          fill="none"
          stroke={palette.glow}
          strokeWidth="1.5"
          opacity="0.35"
        />
      )}
    </svg>
  )
}
