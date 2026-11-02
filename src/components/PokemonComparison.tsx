import { useReducer, useState } from 'react'
import { Link } from 'react-router'
import type { PokemonSummary } from '../types/pokemon.ts'
import createComparisonFormLoader from '../utils/comparisonFormLoader.ts'
import comparisonSelection, { initialComparisonState } from '../utils/comparisonSelection.ts'
import useFavoritePokemon from '../hooks/useFavoritePokemon.ts'
import PokemonStatsComparison from './PokemonStatsComparison.tsx'
import PokemonComparisonSlot from './PokemonComparisonSlot.tsx'
import PokedexFrame from './PokedexFrame.tsx'
import InterfaceIcon from './InterfaceIcon.tsx'
import '../styles/pokemon-comparison.css'

interface PokemonComparisonProps {
  pokemonIndex: PokemonSummary[]
  indexLoading: boolean
  indexError: string | null
}

export default function PokemonComparison({ pokemonIndex, indexLoading, indexError }: PokemonComparisonProps) {
  const [selection, dispatch] = useReducer(comparisonSelection, initialComparisonState)
  const [formLoader] = useState(createComparisonFormLoader)
  const [favoritesEnabled, setFavoritesEnabled] = useState(false)
  const favorites = useFavoritePokemon(favoritesEnabled, formLoader.rememberPokemon)
  const canSwap = Boolean(selection.left.pokemon && selection.right.pokemon &&
    selection.left.pendingId === null && selection.right.pendingId === null)

  return (
    <section className="pokemon-comparison" aria-labelledby="comparison-heading">
      <PokedexFrame>
        <header className="comparison-header">
          <div>
            <p className="comparison-kicker">POKÉDEX / COMPARISON LAB</p>
            <h1 id="comparison-heading">Pokémon Comparison</h1>
            <p className="comparison-intro">Two Pokémon. A closer look at what makes each unique.</p>
          </div>
          <Link className="comparison-back-link" to="/">← Back to Pokédex</Link>
        </header>
        {indexLoading && <p className="comparison-message" role="status">Loading Pokémon search...</p>}
        {indexError && <p className="comparison-message" role="alert">Error: {indexError}</p>}
        <div className="comparison-grid">
          <PokemonComparisonSlot
            side="left"
            pokemonIndex={pokemonIndex}
            selection={selection.left}
            other={selection.right}
            formLoader={formLoader}
            dispatch={dispatch}
            favorites={favorites}
            onFavoritesOpen={() => setFavoritesEnabled(true)}
            searchUnavailable={indexLoading || !!indexError}
          />
          <div className="comparison-versus">
            <span className="comparison-vs-label" aria-hidden="true">VS</span>
            <button className="comparison-swap" type="button" disabled={!canSwap}
              onClick={() => dispatch({ type: 'swap' })} aria-label="Swap Pokémon">
              <InterfaceIcon name="compare" /><span>Swap</span>
            </button>
            <span className="comparison-versus-note">BASE STATS</span>
          </div>
          <PokemonComparisonSlot
            side="right"
            pokemonIndex={pokemonIndex}
            selection={selection.right}
            other={selection.left}
            formLoader={formLoader}
            dispatch={dispatch}
            favorites={favorites}
            onFavoritesOpen={() => setFavoritesEnabled(true)}
            searchUnavailable={indexLoading || !!indexError}
          />
        </div>
        {selection.left.pokemon && selection.right.pokemon && (
          selection.left.pendingId !== null || selection.right.pendingId !== null
            ? <p className="stats-comparison-loading" role="status">Updating stats comparison...</p>
            : <PokemonStatsComparison left={selection.left.pokemon} right={selection.right.pokemon} />
        )}
      </PokedexFrame>
    </section>
  )
}
