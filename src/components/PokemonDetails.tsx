import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { PokemonResponse, PokemonDetailsData } from '../types/pokemon.ts'
import PokemonStats from './PokemonStats.tsx'
import PokemonArtwork from './PokemonArtwork.tsx'
import PokemonAbilities from './PokemonAbilities.tsx'
import PokemonEvolution from './PokemonEvolution.tsx'
import { decimetersToMeters, hectogramsToKilograms } from '../utils/convertPokemonMeasurements.ts'

interface PokemonDetailsState {
  id: string
  pokemon: PokemonDetailsData | null
  error: string | null
}

export default function PokemonDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [details, setDetails] = useState<PokemonDetailsState | null>(null)
  const validId = id !== undefined && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))

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
        const pokemon: PokemonDetailsData = {
          id: data.id,
          name: data.name,
          speciesUrl: data.species.url,
          heightMeters: decimetersToMeters(data.height),
          weightKg: hectogramsToKilograms(data.weight),
          abilities: data.abilities.map((entry) => ({
            name: entry.ability.name,
            isHidden: entry.is_hidden,
            slot: entry.slot,
          })),
          stats: data.stats.map((entry) => ({
            name: entry.stat.name,
            value: entry.base_stat,
          })),
          types: data.types.map((entry) => entry.type.name),
          shinyImage:
            data.sprites.other?.['official-artwork']?.front_shiny ??
            data.sprites.front_shiny ?? null,
          image:
            data.sprites.other?.['official-artwork']?.front_default ??
            data.sprites.front_default,
        }

        if (!controller.signal.aborted) {
          setDetails({ id: requestedId, pokemon, error: null })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setDetails({
            id: requestedId,
            pokemon: null,
            error: err instanceof Error ? err.message : 'Failed to load Pokémon details',
          })
        }
      }
    }

    loadPokemon()
    return () => controller.abort()
  }, [id, validId])

  // Ignore an earlier request's result when the URL changes to another Pokémon.
  const currentDetails = details?.id === id ? details : null
  const error = validId ? currentDetails?.error : 'Invalid Pokémon ID.'
  const loading = validId && !currentDetails
  const pokemon = currentDetails?.pokemon

  return (
    <aside className="pokemon-details">
      <button type="button" onClick={() => navigate('/')}>
        ← Back to Pokédex
      </button>

      {loading && <p role="status">Loading Pokémon details...</p>}
      {error && <p role="alert">Error: {error}</p>}

      {!loading && !error && pokemon && (
        <>
          <h2>
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </h2>

          <PokemonArtwork
            key={pokemon.id}
            name={pokemon.name}
            image={pokemon.image}
            shinyImage={pokemon.shinyImage}
          />

          <p>
            Pokédex Number: #{String(pokemon.id).padStart(4, '0')}
          </p>

          <p>Types: {pokemon.types.join(', ')}</p>

          <dl className="pokemon-measurements" aria-label="Height and weight">
            <div className="pokemon-measurement">
              <dt>Height</dt>
              <dd>{pokemon.heightMeters.toFixed(1)} m</dd>
            </div>
            <div className="pokemon-measurement">
              <dt>Weight</dt>
              <dd>{pokemon.weightKg.toFixed(1)} kg</dd>
            </div>
          </dl>

          <PokemonStats stats={pokemon.stats} />
          <PokemonAbilities abilities={pokemon.abilities} />
          <PokemonEvolution speciesUrl={pokemon.speciesUrl} />
        </>
      )}
    </aside>
  )
}
