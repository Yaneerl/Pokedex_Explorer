import type { ReactNode } from 'react'
import '../styles/pokedex-frame.css'

interface PokedexFrameProps {
  children: ReactNode
}

export default function PokedexFrame({ children }: PokedexFrameProps) {
  return (
    <div className="pokedex-frame">
      <div className="pokedex-frame-top" aria-hidden="true">
        <span className="pokedex-frame-screw" />
        <span className="pokedex-frame-mark">PKDX / FIELD SYSTEM</span>
        <span className="pokedex-frame-lights"><span /><span /></span>
        <span className="pokedex-frame-screw" />
      </div>
      <div className="pokedex-frame-bezel">
        <div className="pokedex-screen">
          <div className="pokedex-screen-content">{children}</div>
        </div>
        <div className="pokedex-frame-console" aria-hidden="true">
          <span className="pokedex-frame-button" />
          <span className="pokedex-frame-serial">POKÉDEX<br />EXPLORER • 01</span>
          <span className="pokedex-frame-grille"><span /><span /><span /><span /></span>
        </div>
      </div>
      <div className="pokedex-frame-bottom" aria-hidden="true">
        <span className="pokedex-frame-screw" /><span className="pokedex-frame-seam" /><span className="pokedex-frame-screw" />
      </div>
    </div>
  )
}
