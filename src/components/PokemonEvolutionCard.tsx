import { Link } from 'react-router'
import type { EvolutionStage } from '../types/pokemon.ts'

interface PokemonEvolutionCardProps {
  stage: EvolutionStage
  currentSpeciesId?: number
  loadingImages?: boolean
}

export default function PokemonEvolutionCard({ stage, currentSpeciesId, loadingImages = false }: PokemonEvolutionCardProps) {
  const name = stage.name.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const isCurrent = stage.id === currentSpeciesId

  return (
    <Link className="pokemon-evolution-card" to={'/pokemon/' + stage.id}
      aria-label={name} aria-current={isCurrent ? 'page' : undefined} data-species-id={stage.id}>
      <span className="pokemon-evolution-number" aria-hidden="true">#{String(stage.id).padStart(4, '0')}</span>
      {stage.image ? (
        <img src={stage.image} alt="" width="120" height="120" />
      ) : (
        <span className={'pokemon-evolution-placeholder' + (loadingImages ? ' details-skeleton-fill' : '')} aria-hidden={loadingImages || undefined}>{loadingImages ? null : 'Image unavailable'}</span>
      )}
      <span className="pokemon-evolution-name">{name}</span>
      <span className="pokemon-evolution-card-state">{isCurrent ? 'Current Pokémon' : 'View details'}</span>
    </Link>
  )
}
