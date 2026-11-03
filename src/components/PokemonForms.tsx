import { useEffect, useId, useState } from 'react'
import type { PokemonMegaFormsData, PokemonResponse } from '../types/pokemon.ts'
import loadMegaForms from '../utils/loadMegaForms.ts'
import toPokemonDetails from '../utils/toPokemonDetails.ts'
import { getPokemonTypeStyle } from '../utils/pokemonTypeTheme.ts'
import usePokemonSpecies from '../hooks/usePokemonSpecies.ts'
import PokemonHero from './PokemonHero.tsx'
import PokemonStats from './PokemonStats.tsx'
import PokemonAbilities from './PokemonAbilities.tsx'
import PokemonEvolution from './PokemonEvolution.tsx'
import PokemonFavoriteButton from './PokemonFavoriteButton.tsx'
import PokemonMeasurements from './PokemonMeasurements.tsx'

interface PokemonFormsProps {
  pokemon: PokemonResponse
}

interface MegaFormsState {
  data: PokemonMegaFormsData | null
  error: string | null
}

export default function PokemonForms({ pokemon }: PokemonFormsProps) {
  const selectId = useId()
  const pokedexId = Number(pokemon.species.url.split('/').filter(Boolean).at(-1))
  const speciesName = pokemon.species.name.charAt(0).toUpperCase() + pokemon.species.name.slice(1)
  const [selectedId, setSelectedId] = useState(pokemon.id)
  const [forms, setForms] = useState<MegaFormsState | null>(null)
  const species = usePokemonSpecies(pokemon.species.url)
  const speciesData = species.data

  useEffect(() => {
    if (!speciesData) return
    const controller = new AbortController()
    async function load(): Promise<void> {
      try {
        const data = await loadMegaForms(pokemon, controller.signal, speciesData ?? undefined)
        if (!controller.signal.aborted) setForms({ data, error: null })
      } catch (err) {
        if (!controller.signal.aborted) {
          setForms({ data: null, error: err instanceof Error ? err.message : 'Failed to load Mega forms' })
          controller.abort()
        }
      }
    }
    load()
    return () => controller.abort()
  }, [pokemon, speciesData])

  const options = forms?.data
    ? [{ label: 'Regular', pokemon: forms.data.regular }, ...forms.data.megaForms]
    : []
  const selected = options.find((option) => option.pokemon.id === selectedId)
  const active = selected?.pokemon ?? toPokemonDetails(pokemon)
  const heading = selected && selected.pokemon.id !== forms?.data?.regular.id
    ? selected.label
    : active.name.charAt(0).toUpperCase() + active.name.slice(1)

  return (
    <div className="pokemon-details-display" style={getPokemonTypeStyle(active.types[0] ?? 'normal')}>
      <PokemonHero pokemon={active} heading={heading} pokedexId={pokedexId} species={species} formControls={
        <>
          {!forms && !species.error && <div className="details-forms-loading" role="status"><span className="details-loading-announcement">Loading Mega forms...</span><span className="details-skeleton-forms details-skeleton-fill" aria-hidden="true" /></div>}
          {forms?.error && <p role="alert">Error: {forms.error}</p>}
          {species.error && <p className="pokemon-forms-unavailable">Mega forms are unavailable while species data cannot be loaded.</p>}
          {forms?.data && forms.data.megaForms.length > 0 && (
            <div className="pokemon-mega-forms">
              <label htmlFor={selectId}>Mega Evolution</label>
              <select id={selectId} value={selected ? selectedId : ''} onChange={(event) => setSelectedId(Number(event.target.value))}>
                {!selected && <option value="" disabled>Current form</option>}
                {options.map((option) => <option key={option.pokemon.id} value={option.pokemon.id}>{option.label}</option>)}
              </select>
            </div>
          )}
        </>
      }>
        <PokemonFavoriteButton pokemonId={pokedexId} name={speciesName} />
      </PokemonHero>
      <PokemonEvolution speciesUrl={pokemon.species.url} speciesState={species} currentSpeciesId={pokedexId} />
      <div className="pokemon-details-data-grid">
        <PokemonMeasurements heightMeters={active.heightMeters} weightKg={active.weightKg} />
        <PokemonStats stats={active.stats} />
        <PokemonAbilities abilities={active.abilities} />
      </div>
    </div>
  )
}
