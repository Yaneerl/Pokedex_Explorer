import type { PokemonAbility } from '../types/pokemon.ts'

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
          <li className="pokemon-ability" key={ability.slot}>
            <span className="pokemon-ability-name">{formatAbilityName(ability.name)}</span>
            <span className={
              'pokemon-ability-badge' + (ability.isHidden ? ' pokemon-ability-badge--hidden' : '')
            }>
              {ability.isHidden ? 'Hidden Ability' : 'Regular Ability'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
