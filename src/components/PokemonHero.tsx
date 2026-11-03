import type { ReactNode } from 'react'
import type { PokemonClassification, PokemonDetailsData } from '../types/pokemon.ts'
import type { PokemonSpeciesResult } from '../hooks/usePokemonSpecies.ts'
import PokemonArtwork from './PokemonArtwork.tsx'
import PokemonSpeciesInfo from './PokemonSpeciesInfo.tsx'
import PokemonTypeBadge from './PokemonTypeBadge.tsx'

interface PokemonHeroProps {
  pokemon: PokemonDetailsData
  heading: string
  pokedexId: number
  species: PokemonSpeciesResult
  children: ReactNode
  formControls?: ReactNode
}

export default function PokemonHero({ pokemon, heading, pokedexId, species, children, formControls }: PokemonHeroProps) {
  const classification: PokemonClassification = species.data?.is_mythical ? 'mythical'
    : species.data?.is_legendary ? 'legendary' : 'regular'

  return (
    <div className="pokemon-hero">
      <div className="pokemon-hero-display">
        <span className="details-section-code pokemon-hero-display-label" aria-hidden="true">SPECIMEN DISPLAY / 01</span>
        <PokemonArtwork key={pokemon.id} name={pokemon.name} image={pokemon.image} shinyImage={pokemon.shinyImage} classification={classification} hero />
        <div className="pokemon-hero-form-controls">{formControls}</div>
      </div>
      <div className="pokemon-hero-info">
        <div className="pokemon-hero-identity">
          <p className="pokemon-record-number">Pokédex Number: #{String(pokedexId).padStart(4, '0')}</p>
          <h2>{heading}</h2>
          <div className="pokemon-hero-types" role="group" aria-label="Pokémon types">
            {pokemon.types.map((type) => <PokemonTypeBadge key={type} type={type} />)}
          </div>
          {classification !== 'regular' && (
            <p className={'pokemon-classification pokemon-classification--' + classification}>
              <span aria-hidden="true">✦</span> {classification === 'legendary' ? 'Legendary' : 'Mythical'} Pokémon
            </p>
          )}
        </div>
        <PokemonSpeciesInfo species={species} />
        <div className="pokemon-form-controls">{children}</div>
      </div>
    </div>
  )
}
