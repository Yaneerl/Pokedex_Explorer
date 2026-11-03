import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate, useNavigationType, useParams } from 'react-router'
import type { PokemonResponse } from '../types/pokemon.ts'
import PokedexFrame from './PokedexFrame.tsx'
import PokemonForms from './PokemonForms.tsx'
import PokemonDetailsSkeleton from './PokemonDetailsSkeleton.tsx'
import '../styles/details-loading.css'
import '../styles/pokemon-details.css'

interface PokemonDetailsState {
  id: string
  attempt: number
  pokemon: PokemonResponse | null
  error: string | null
}

export default function PokemonDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [attempt, setAttempt] = useState(0)
  const [details, setDetails] = useState<PokemonDetailsState | null>(null)
  const validId = id !== undefined && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))

  useLayoutEffect(() => {
    // New details visits start at the hero; POP keeps the browser's history restoration.
    if (navigationType !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [id, navigationType])

  useEffect(() => {
    if (!id || !validId) return
    const requestedId = id
    const controller = new AbortController()

    async function loadPokemon(): Promise<void> {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + requestedId, {
          signal: controller.signal,
        })
        if (response.status === 404) throw new Error('Pokémon not found.')
        if (!response.ok) throw new Error('Failed to load Pokémon details')

        const data: PokemonResponse = await response.json()

        if (!controller.signal.aborted) {
          setDetails({ id: requestedId, attempt, pokemon: data, error: null })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setDetails({
            id: requestedId,
            attempt,
            pokemon: null,
            error: err instanceof Error ? err.message : 'Failed to load Pokémon details',
          })
        }
      }
    }

    loadPokemon()
    return () => controller.abort()
  }, [id, validId, attempt])

  // Ignore an earlier request's result when the URL changes to another Pokémon.
  const currentDetails = details !== null && details.id === id && details.attempt === attempt ? details : null
  const error = validId ? currentDetails?.error : 'Invalid Pokémon ID.'
  const loading = validId && !currentDetails
  const pokemon = currentDetails?.pokemon

  return (
    <section className="pokemon-details" aria-label="Pokémon details">
      <PokedexFrame>
        <div className="pokemon-details-content">
          <button type="button" onClick={() => navigate('/')}>
            ← Back to Pokédex
          </button>

          {loading && <PokemonDetailsSkeleton />}
          {error && <div className="pokemon-details-error"><p role="alert">Error: {error}</p>{validId && <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry loading details</button>}</div>}

          {!loading && !error && pokemon && (
            <PokemonForms key={pokemon.id} pokemon={pokemon} />
          )}
        </div>
      </PokedexFrame>
    </section>
  )
}
