import type { PokemonAbility } from '../types/pokemon.ts'
import InterfaceIcon from './InterfaceIcon.tsx'

interface PokemonAbilitiesProps {
  abilities: PokemonAbility[]
}

function formatAbilityName(name: string): string {
  return name.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function PokemonAbilities({ abilities }: PokemonAbilitiesProps) {
  return (
    <section className="pokemon-abilities" aria-labelledby="pokemon-abilities-heading">
      <h3 id="pokemon-abilities-heading">Abilities</h3>
      <ul className="pokemon-abilities-list">
        {abilities.map((ability) => (
          <li className={'pokemon-ability' + (ability.isHidden ? ' pokemon-ability--hidden' : '')} key={ability.slot}>
            <span className="pokemon-ability-icon"><InterfaceIcon name={ability.isHidden ? 'hidden' : 'ability'} /></span>
            <div className="pokemon-ability-content">
              <span className={
                'pokemon-ability-badge' + (ability.isHidden ? ' pokemon-ability-badge--hidden' : '')
              }>
                {ability.isHidden ? 'Hidden Ability' : 'Regular Ability'}
              </span>
              <span className="pokemon-ability-name">{formatAbilityName(ability.name)}</span>
            </div>
            <span className="pokemon-ability-slot" aria-hidden="true">{String(ability.slot).padStart(2, '0')}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
