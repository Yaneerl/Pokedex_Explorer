import { useId } from 'react'

export default function PokedexDevice() {
  const id = useId().replaceAll(':', '')
  return (
    <div className="pokedex-device" aria-hidden="true">
      {(['upper', 'lower'] as const).map((side) => (
        <div key={side} className={'pokedex-device-half pokedex-device-' + side}>
          <div className="pokedex-device-panel">
            {(['left', 'right'] as const).map((corner) => (
              <svg key={corner} className={'pokedex-device-corner pokedex-device-corner--' + corner} viewBox="0 0 120 120" focusable="false">
                <path d="M0 102C56 100 100 56 102 0M0 72C39 70 70 39 72 0" fill="none" stroke="#76162c" strokeWidth="4" />
                <path d="M0 107C60 105 105 60 107 0" fill="none" stroke="#ffb0b8" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="23" cy="23" r="6" fill="#92172f" stroke="#ec7788" strokeWidth="2" /><path d="M20 23H26" stroke="#4c1727" strokeWidth="2" />
              </svg>
            ))}
            {side === 'upper' && <div className="pokedex-device-engraving"><span>POKÉDEX</span><span>EXPLORER</span></div>}
            <div className="pokedex-device-seam" />
          </div>
          <svg className="pokedex-device-rim" viewBox="0 0 260 140" focusable="false">
            <defs>
              <linearGradient id={id + '-metal-' + side} x1="0" y1="0" x2="0.7" y2="1">
                <stop stopColor="#f4f8f9" /><stop offset="0.3" stopColor="#a6b1b6" /><stop offset="0.6" stopColor="#3c474e" /><stop offset="1" stopColor="#1c2730" />
              </linearGradient>
            </defs>
            <path d="M10 140A120 120 0 0 1 250 140H230A100 100 0 0 0 30 140Z" fill={'url(#' + id + '-metal-' + side + ')'} stroke="#25333c" strokeWidth="2" />
            <path d="M15 139A115 115 0 0 1 245 139" fill="none" stroke="#e9f4f8" strokeWidth="2" />
            <path d="M31 139A99 99 0 0 1 229 139" fill="none" stroke="#101e29" strokeWidth="3" />
          </svg>
          {side === 'upper' && (
            <svg className="pokedex-device-lens" viewBox="0 0 220 220" focusable="false">
              <defs>
                <radialGradient id={id + '-lens'}><stop stopColor="#e4ffff" /><stop offset="0.4" stopColor="#a8f9ff" /><stop offset="0.75" stopColor="#44cce9" /><stop offset="1" stopColor="#197da1" /></radialGradient>
                <radialGradient id={id + '-halo'}><stop stopColor="#91f4ff" stopOpacity="0.65" /><stop offset="1" stopColor="#91f4ff" stopOpacity="0" /></radialGradient>
              </defs>
              <circle cx="110" cy="110" r="104" fill="#1f303c" stroke="#b9cbd0" strokeWidth="4" />
              <circle className="pokedex-device-glow" cx="110" cy="110" r="100" fill={'url(#' + id + '-halo)'} />
              <g className="pokedex-device-light">
                <circle cx="110" cy="110" r="70" fill={'url(#' + id + '-lens)'} stroke="#c9fcff" strokeWidth="3" />
                <circle cx="110" cy="110" r="54" fill="none" stroke="#edffff" strokeOpacity="0.75" strokeWidth="2" />
                <circle cx="110" cy="110" r="37" fill="none" stroke="#edffff" strokeOpacity="0.55" strokeWidth="2" />
                <ellipse cx="90" cy="87" rx="24" ry="12" fill="white" opacity="0.5" transform="rotate(-35 90 87)" />
              </g>
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}
