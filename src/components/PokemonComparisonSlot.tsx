import { useEffect, useId, useState } from 'react'
import type { Dispatch } from 'react'
import type { PokemonResponse, PokemonSummary } from '../types/pokemon.ts'
import type { ComparisonAction, ComparisonSelection, ComparisonSide } from '../utils/comparisonSelection.ts'
import type { FavoritePokemonResult } from '../hooks/useFavoritePokemon.ts'
import PokemonComparisonFavorites from './PokemonComparisonFavorites.tsx'
import searchPokemon from '../utils/searchPokemon.ts'
import toPokemonCard from '../utils/toPokemonCard.ts'
import PokemonCardContent from './PokemonCardContent.tsx'

interface PokemonComparisonSlotProps {
  side: ComparisonSide
  pokemonIndex: PokemonSummary[]
  selection: ComparisonSelection
  favorites: FavoritePokemonResult
  onFavoritesOpen: () => void
  searchUnavailable: boolean
  dispatch: Dispatch<ComparisonAction>
}

export default function PokemonComparisonSlot({ side, pokemonIndex, selection, dispatch, favorites, onFavoritesOpen, searchUnavailable }: PokemonComparisonSlotProps) {
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
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + id, { signal: controller.signal })
        if (response.status === 404) throw new Error('Pokémon was not found.')
        if (!response.ok) throw new Error('Failed to load Pokémon.')
        const data: PokemonResponse = await response.json()
        if (data.id !== id) throw new Error('Unexpected Pokémon data.')
        if (!controller.signal.aborted) dispatch({ type: 'loaded', side, id, pokemon: toPokemonCard(data) })
      } catch (error) {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed', side, id, error: error instanceof Error ? error.message : 'Failed to load Pokémon.' })
        }
      }
    }
    loadPokemon()
    return () => controller.abort()
  }, [requestedId, side, dispatch])

  return (
    <section className="comparison-slot" aria-labelledby={fieldId + '-heading'}>
      <h2 id={fieldId + '-heading'}>Pokémon {number}</h2>
      <div className="comparison-source" role="group" aria-label={'Selection source for Pokémon ' + number}>
        <button type="button" aria-pressed={source === 'search'} onClick={() => setSource('search')}>Search Pokémon</button>
        <button type="button" aria-pressed={source === 'favorites'} onClick={() => { setSource('favorites'); onFavoritesOpen() }}>My Favorites</button>
      </div>
      {source === 'favorites' ? (
        <PokemonComparisonFavorites number={number} favorites={favorites} onSelect={(pokemon) => dispatch({ type: 'select', side, id: pokemon.id, pokemon })} />
      ) : (
        <>
          <label htmlFor={fieldId}>Search Pokémon {number}</label>
          <input
            id={fieldId}
            type="search"
            disabled={searchUnavailable}
            placeholder="Name or Pokédex number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {!searchUnavailable && normalizedQuery && (matches.length > 0 ? (
            <ul className="comparison-results" aria-label={'Search results for Pokémon ' + number}>
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-label={'Select ' + item.name + ' for Pokémon ' + number}
                    onClick={() => { dispatch({ type: 'select', side, id: item.id }); setQuery('') }}
                  >
                    #{String(item.id).padStart(4, '0')} · {item.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : <p>No Pokémon found.</p>)}
        </>
      )}
      {requestedId !== null && <p role="status">Loading Pokémon {number}...</p>}
      {selection.error && <p role="alert">{selection.error}</p>}
      {selection.pokemon ? (
        <article className="pokemon-card comparison-pokemon" aria-label={'Selected Pokémon ' + number}>
          <PokemonCardContent pokemon={selection.pokemon} />
        </article>
      ) : requestedId === null && <p className="comparison-empty">{source === 'search' ? 'No Pokémon selected. Search by name or Pokédex number.' : 'No Pokémon selected.'}</p>}
    </section>
  )
}
