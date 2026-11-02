import { useEffect, useId, useState } from 'react'
import type { Dispatch } from 'react'
import type { PokemonSummary } from '../types/pokemon.ts'
import type { ComparisonAction, ComparisonSelection, ComparisonSide } from '../utils/comparisonSelection.ts'
import type { FavoritePokemonResult } from '../hooks/useFavoritePokemon.ts'
import PokemonComparisonFavorites from './PokemonComparisonFavorites.tsx'
import PokemonComparisonPreview from './PokemonComparisonPreview.tsx'
import PokemonComparisonForms from './PokemonComparisonForms.tsx'
import type { ComparisonFormLoader } from '../utils/comparisonFormLoader.ts'
import InterfaceIcon from './InterfaceIcon.tsx'
import searchPokemon from '../utils/searchPokemon.ts'
import toPokemonWithStats from '../utils/toPokemonWithStats.ts'

interface PokemonComparisonSlotProps {
  side: ComparisonSide
  pokemonIndex: PokemonSummary[]
  selection: ComparisonSelection
  other: ComparisonSelection
  formLoader: ComparisonFormLoader
  favorites: FavoritePokemonResult
  onFavoritesOpen: () => void
  searchUnavailable: boolean
  dispatch: Dispatch<ComparisonAction>
}

export default function PokemonComparisonSlot({ side, pokemonIndex, selection, other, formLoader, dispatch, favorites, onFavoritesOpen, searchUnavailable }: PokemonComparisonSlotProps) {
  const fieldId = useId()
  const number = side === 'left' ? 1 : 2
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'search' | 'favorites'>('search')
  const normalizedQuery = query.trim().toLowerCase()
  const matches = normalizedQuery ? searchPokemon(pokemonIndex, normalizedQuery) : []
  const requestedId = selection.pendingId

  useEffect(() => {
    if (requestedId === null) return
    const id = requestedId
    const controller = new AbortController()
    async function loadPokemon(): Promise<void> {
      try {
        const data = await formLoader.loadPokemon(id, controller.signal)
        const pokemon = toPokemonWithStats(data)
        if (controller.signal.aborted) return
        dispatch({ type: 'preview-loaded', side, id, pokemon })
        try {
          const forms = await formLoader.loadForms(id, controller.signal)
          if (!controller.signal.aborted) dispatch({ type: 'loaded', side, id, pokemon, forms })
        } catch (error) {
          if (!controller.signal.aborted) dispatch({
            type: 'loaded', side, id, pokemon,
            formsError: error instanceof Error ? error.message : 'Mega forms are unavailable.',
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed', side, id, error: error instanceof Error ? error.message : 'Failed to load Pokémon.' })
        }
      }
    }
    void loadPokemon()
    return () => controller.abort()
  }, [requestedId, side, dispatch, formLoader])

  return (
    <section className="comparison-slot" aria-labelledby={fieldId + '-heading'}>
      <header className="comparison-slot-header">
        <span className="comparison-slot-code" aria-hidden="true">0{number}</span>
        <h2 id={fieldId + '-heading'}>Pokémon {number}</h2>
        <span className={'comparison-slot-indicator' + (selection.pokemon ? ' is-ready' : '')} aria-hidden="true" />
      </header>
      {selection.pokemon ? (
        <PokemonComparisonPreview key={selection.pokemon.id + ':' + selection.pokemon.image}
          pokemon={selection.pokemon} number={number} pokedexId={selection.baseId} />
      ) : (
        <div className="comparison-vacant">
          <div className="comparison-artwork" aria-hidden="true">
            <span className="comparison-vacant-orbit"><span>?</span></span>
          </div>
          <p className="comparison-vacant-title">Choose your Pokémon</p>
          <p className="comparison-empty">{source === 'search' ? 'No Pokémon selected. Search by name or Pokédex number.' : 'No Pokémon selected.'}</p>
        </div>
      )}
      <PokemonComparisonForms selection={selection} other={other} side={side} dispatch={dispatch} />
      <div className="comparison-selection-panel">
        <div className="comparison-source" role="group" aria-label={'Selection source for Pokémon ' + number}>
          <button type="button" aria-pressed={source === 'search'} onClick={() => setSource('search')}>
            <InterfaceIcon name="search" /><span>Search Pokémon</span>
          </button>
          <button type="button" aria-pressed={source === 'favorites'} onClick={() => { setSource('favorites'); onFavoritesOpen() }}>
            <InterfaceIcon name="heart" /><span>My Favorites</span>
          </button>
        </div>
        {source === 'favorites' ? (
          <PokemonComparisonFavorites number={number} favorites={favorites} onSelect={(pokemon) => dispatch({ type: 'select', side, id: pokemon.id, pokemon })} />
        ) : (
          <>
            <label htmlFor={fieldId}>Search Pokémon {number}</label>
            <div className="comparison-search-field">
              <InterfaceIcon name="search" />
              <input id={fieldId} type="search" disabled={searchUnavailable}
                placeholder="Name or Pokédex number" value={query}
                onChange={(event) => setQuery(event.target.value)} />
            </div>
            {!searchUnavailable && normalizedQuery && (matches.length > 0 ? (
              <ul className="comparison-results" aria-label={'Search results for Pokémon ' + number}>
                {matches.map((item) => (
                  <li key={item.id}>
                    <button type="button" aria-label={'Select ' + item.name + ' for Pokémon ' + number}
                      onClick={() => { dispatch({ type: 'select', side, id: item.id }); setQuery('') }}>
                      #{String(item.id).padStart(4, '0')} · {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="comparison-empty">No Pokémon found.</p>)}
          </>
        )}
        {requestedId !== null && <p className="comparison-message" role="status">Loading Pokémon {number}...</p>}
        {selection.error && <p className="comparison-message" role="alert">{selection.error}</p>}
        {selection.formsError && <p className="comparison-form-warning" role="alert">Mega forms unavailable: {selection.formsError}</p>}
      </div>
    </section>
  )
}
