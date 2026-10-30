import { Link } from 'react-router'
import type { EvolutionStage } from '../types/pokemon.ts'

interface PokemonEvolutionStageProps {
  stage: EvolutionStage
  isRoot?: boolean
}

export default function PokemonEvolutionStage({ stage, isRoot = true }: PokemonEvolutionStageProps) {
  const name = stage.name.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <li className="pokemon-evolution-node">
      {!isRoot && <span className="pokemon-evolution-arrow" aria-hidden="true">→</span>}
      <div className="pokemon-evolution-connection">
        <Link className="pokemon-evolution-card" to={'/pokemon/' + stage.id}>
          {stage.image ? (
            <img src={stage.image} alt="" width="80" height="80" />
          ) : (
            <span className="pokemon-evolution-placeholder">Image unavailable</span>
          )}
          <span>{name}</span>
        </Link>
        {stage.children.length > 0 && (
          <ul className="pokemon-evolution-branches">
            {stage.children.map((child) => (
              <PokemonEvolutionStage key={child.id} stage={child} isRoot={false} />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
