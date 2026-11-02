import type { ReactNode } from 'react'
import type { PokemonClassification } from '../types/pokemon.ts'
import useArtworkTilt from '../hooks/useArtworkTilt.ts'

interface PokemonArtworkSceneProps {
  classification: PokemonClassification
  interactive: boolean
  children: ReactNode
}

/** Pointer movement and ambient animation have separate planes; image layout stays stable. */
export default function PokemonArtworkScene({ classification, interactive, children }: PokemonArtworkSceneProps) {
  const { ref, onPointerMove, onPointerLeave } = useArtworkTilt(interactive)

  return (
    <div ref={ref} className={'pokemon-artwork-preview pokemon-artwork-scene pokemon-artwork-scene--' + classification}
      onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div className="pokemon-scene-atmosphere" aria-hidden="true">
        <div className="pokemon-scene-light-plane"><div className="pokemon-scene-aura" /></div>
        <div className="pokemon-scene-backdrop">
          <div className="pokemon-scene-grid" />
          <div className="pokemon-scene-orbit" />
        </div>
        {classification !== 'regular' && (
          <div className="pokemon-scene-particles">
            {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
          </div>
        )}
      </div>
      <div className="pokemon-scene-image-plane">
        <div className="pokemon-scene-image-frame">{children}</div>
      </div>
    </div>
  )
}
