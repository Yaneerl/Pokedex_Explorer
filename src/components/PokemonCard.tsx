import type { KeyboardEvent, ReactNode } from 'react'
import type { Pokemon } from '../types/pokemon.ts'
import PokemonCardContent from './PokemonCardContent.tsx'

interface PokemonCardProps {
  pokemon: Pokemon
  onSelect: (pokemon: Pokemon) => void
  actions?: ReactNode
}

export default function PokemonCard({ pokemon, onSelect, actions }: PokemonCardProps) {
  const selectionProps = {
    role: 'button',
    tabIndex: 0,
    onClick: () => onSelect(pokemon),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(pokemon)
      }
    },
  }
  const content = <PokemonCardContent pokemon={pokemon} />

  return (
    <li className="pokemon-card" {...(actions ? {} : selectionProps)}>
      {actions ? (
        <div className="pokemon-card-select" aria-label={'View ' + pokemon.name + ' details'} {...selectionProps}>
          {content}
        </div>
      ) : content}
      {actions}
    </li>
  )
}
