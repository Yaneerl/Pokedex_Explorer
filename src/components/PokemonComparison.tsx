import { useReducer, useState } from 'react'
import { Link } from 'react-router'
import type { PokemonSummary } from '../types/pokemon.ts'
import comparisonSelection, { initialComparisonState } from '../utils/comparisonSelection.ts'
import useFavoritePokemon from '../hooks/useFavoritePokemon.ts'
import PokemonComparisonSlot from './PokemonComparisonSlot.tsx'

interface PokemonComparisonProps {
  pokemonIndex: PokemonSummary[]
  indexLoading: boolean
  indexError: string | null
}

export default function PokemonComparison({ pokemonIndex, indexLoading, indexError }: PokemonComparisonProps) {
  const [selection, dispatch] = useReducer(comparisonSelection, initialComparisonState)

  const [favoritesEnabled, setFavoritesEnabled] = useState(false)
  const favorites = useFavoritePokemon(favoritesEnabled)

  return (
    <section className="pokemon-comparison" aria-labelledby="comparison-heading">
      <header className="app-header">
        <h1 id="comparison-heading">Pokémon Comparison</h1>
        <Link className="comparison-back-link" to="/">← Back to Pokédex</Link>
      </header>
      {indexLoading && <p role="status">Loading Pokémon search...</p>}
      {indexError && <p role="alert">Error: {indexError}</p>}
      <div className="comparison-grid">
        <PokemonComparisonSlot
          side="left"
          pokemonIndex={pokemonIndex}
          selection={selection.left}
          dispatch={dispatch}
          favorites={favorites}
          onFavoritesOpen={() => setFavoritesEnabled(true)}
          searchUnavailable={indexLoading || !!indexError}
        />
        <PokemonComparisonSlot
          side="right"
          pokemonIndex={pokemonIndex}
          selection={selection.right}
          dispatch={dispatch}
          favorites={favorites}
          onFavoritesOpen={() => setFavoritesEnabled(true)}
          searchUnavailable={indexLoading || !!indexError}
        />
      </div>
    </section>
  )
}
