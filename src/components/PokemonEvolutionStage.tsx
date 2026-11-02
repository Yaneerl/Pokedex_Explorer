import { Link } from 'react-router'
import type { EvolutionStage } from '../types/pokemon.ts'

interface PokemonEvolutionStageProps {
  stage: EvolutionStage
  showIncomingArrow?: boolean
}

export default function PokemonEvolutionStage({ stage, showIncomingArrow = false }: PokemonEvolutionStageProps) {
  const name = stage.name.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const hasFork = stage.children.length > 1
  const branches = stage.children.length > 0 ? (
    <ul className={'pokemon-evolution-branches' + (hasFork ? ' pokemon-evolution-branches--fork' : '')}
      aria-label={'Direct evolutions of ' + name}>
      {stage.children.map((child) => (
        <PokemonEvolutionStage key={child.id} stage={child} showIncomingArrow={!hasFork} />
      ))}
    </ul>
  ) : null

  return (
    <li className="pokemon-evolution-node">
      {showIncomingArrow && <span className="pokemon-evolution-arrow" aria-hidden="true">→</span>}
      <div className={'pokemon-evolution-connection' + (hasFork ? ' pokemon-evolution-connection--fork' : '')}>
        <Link className="pokemon-evolution-card" to={'/pokemon/' + stage.id}>
          {stage.image ? (
            <img src={stage.image} alt="" width="80" height="80" />
          ) : (
            <span className="pokemon-evolution-placeholder">Image unavailable</span>
          )}
          <span>{name}</span>
        </Link>
        {hasFork ? (
          <div className="pokemon-evolution-fork">
            <p className="pokemon-evolution-fork-label">Direct evolutions of {name}</p>
            {branches}
          </div>
        ) : branches}
      </div>
    </li>
  )
}
