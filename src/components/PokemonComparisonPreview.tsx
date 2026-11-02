import { useState } from 'react'
import type { PokemonWithStats } from '../types/pokemon.ts'
import { getPokemonTypeStyle } from '../utils/pokemonTypeTheme.ts'
import useArtworkTilt from '../hooks/useArtworkTilt.ts'
import PokemonArtworkImage from './PokemonArtworkImage.tsx'
import PokemonTypeBadge from './PokemonTypeBadge.tsx'

interface PokemonComparisonPreviewProps {
  pokemon: PokemonWithStats
  number: number
  pokedexId?: number
}

export default function PokemonComparisonPreview({ pokemon, number, pokedexId = pokemon.id }: PokemonComparisonPreviewProps) {
  const [failed, setFailed] = useState(false)
  const { ref, onPointerMove, onPointerLeave } = useArtworkTilt(Boolean(pokemon.image && !failed))
  return (
    <article className="comparison-pokemon" aria-label={'Selected Pokémon ' + number}
      style={getPokemonTypeStyle(pokemon.types[0] ?? 'normal')}>
      <span className="comparison-record">#{String(pokedexId).padStart(4, '0')}</span>
      <div className="comparison-artwork" ref={ref}
        onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        {pokemon.image && !failed ? (
          <>
            <span className="comparison-artwork-shadow" aria-hidden="true" />
            <div className="comparison-artwork-image-plane">
              <div className="comparison-artwork-image-frame">
                <PokemonArtworkImage source={pokemon.image} alt={pokemon.name + ' official artwork'}
                  inset={18} onError={() => setFailed(true)} />
              </div>
            </div>
          </>
        ) : <p className="comparison-image-missing">Image unavailable</p>}
      </div>
      <h3>{pokemon.name}</h3>
      <div className="comparison-types">
        {pokemon.types.map((type) => <PokemonTypeBadge key={type} type={type} />)}
      </div>
    </article>
  )
}
