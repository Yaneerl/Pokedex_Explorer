import type { EvolutionStage } from '../types/pokemon.ts'
import PokemonEvolutionCard from './PokemonEvolutionCard.tsx'

interface PokemonEvolutionStageProps {
  stage: EvolutionStage
  showIncomingArrow?: boolean
  currentSpeciesId?: number
  loadingImages?: boolean
}

export default function PokemonEvolutionStage({ stage, showIncomingArrow = false, currentSpeciesId, loadingImages = false }: PokemonEvolutionStageProps) {
  const name = stage.name.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const hasFork = stage.children.length > 1
  const branches = stage.children.length > 0 ? (
    <ul className={'pokemon-evolution-branches' + (hasFork ? ' pokemon-evolution-branches--fork' : '')}
      aria-label={'Direct evolutions of ' + name} data-parent-id={stage.id}>
      {stage.children.map((child) => (
        <PokemonEvolutionStage key={child.id} stage={child} showIncomingArrow={!hasFork} currentSpeciesId={currentSpeciesId} loadingImages={loadingImages} />
      ))}
    </ul>
  ) : null

  return (
    <li className="pokemon-evolution-node">
      {showIncomingArrow && <span className="pokemon-evolution-arrow" aria-hidden="true">→</span>}
      <div className={'pokemon-evolution-connection' + (hasFork ? ' pokemon-evolution-connection--fork' : '')}>
        <PokemonEvolutionCard stage={stage} currentSpeciesId={currentSpeciesId} loadingImages={loadingImages} />
        {hasFork ? (
          <div className={'pokemon-evolution-fork pokemon-evolution-fork--columns-' + Math.min(4, stage.children.length)}>
            <p className="pokemon-evolution-fork-label">Direct evolutions of {name}</p>
            {branches}
          </div>
        ) : branches}
      </div>
    </li>
  )
}
