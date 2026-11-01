import { useEffect, useId, useState } from 'react'
import type { PokemonMegaFormsData, PokemonResponse } from '../types/pokemon.ts'
import loadMegaForms from '../utils/loadMegaForms.ts'
import toPokemonDetails from '../utils/toPokemonDetails.ts'
import PokemonArtwork from './PokemonArtwork.tsx'
import PokemonStats from './PokemonStats.tsx'
import PokemonAbilities from './PokemonAbilities.tsx'

interface PokemonFormsProps {
  pokemon: PokemonResponse
}

interface MegaFormsState {
  data: PokemonMegaFormsData | null
  error: string | null
}

export default function PokemonForms({ pokemon }: PokemonFormsProps) {
  const selectId = useId()
  const [selectedId, setSelectedId] = useState(pokemon.id)
  const [forms, setForms] = useState<MegaFormsState | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load(): Promise<void> {
      try {
        const data = await loadMegaForms(pokemon, controller.signal)
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
  }, [pokemon])

  const options = forms?.data
    ? [{ label: 'Regular', pokemon: forms.data.regular }, ...forms.data.megaForms]
    : []
  const selected = options.find((option) => option.pokemon.id === selectedId)
  const active = selected?.pokemon ?? toPokemonDetails(pokemon)
  const heading = selected && selected.pokemon.id !== forms?.data?.regular.id
    ? selected.label
    : active.name.charAt(0).toUpperCase() + active.name.slice(1)

  return (
    <>
      <h2>{heading}</h2>
      {!forms && <p role="status">Loading Mega forms...</p>}
      {forms?.error && <p role="alert">Error: {forms.error}</p>}
      {forms?.data && forms.data.megaForms.length > 0 && (
        <div className="pokemon-mega-forms">
          <label htmlFor={selectId}>Mega Evolution</label>
          <select
            id={selectId}
            value={selected ? selectedId : ''}
            onChange={(event) => setSelectedId(Number(event.target.value))}
          >
            {!selected && <option value="" disabled>Current form</option>}
            {options.map((option) => (
              <option key={option.pokemon.id} value={option.pokemon.id}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      <PokemonArtwork
        key={active.id}
        name={active.name}
        image={active.image}
        shinyImage={active.shinyImage}
      />
      <p>Pokédex Number: #{String(pokemon.species.url.split('/').filter(Boolean).at(-1)).padStart(4, '0')}</p>
      <p>Types: {active.types.join(', ')}</p>
      <dl className="pokemon-measurements" aria-label="Height and weight">
        <div className="pokemon-measurement">
          <dt>Height</dt>
          <dd>{active.heightMeters.toFixed(1)} m</dd>
        </div>
        <div className="pokemon-measurement">
          <dt>Weight</dt>
          <dd>{active.weightKg.toFixed(1)} kg</dd>
        </div>
      </dl>
      <PokemonStats stats={active.stats} />
      <PokemonAbilities abilities={active.abilities} />
    </>
  )
}
