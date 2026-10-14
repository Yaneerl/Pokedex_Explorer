import PokemonCard from './PokemonCard.tsx'

import type { Pokemon } from '../types/pokemon.ts'

interface PokemonListProps {
  pokemon: Pokemon[]
  onSelect: (pokemon: Pokemon) => void
}

export default function PokemonList({ pokemon, onSelect }: PokemonListProps) {
  return (
    <section aria-labelledby="pokemon-heading">
      <div className="list-heading">
        <h2 id="pokemon-heading">Explore Pokémon</h2>
        <span>{pokemon.length} discovered</span>
      </div>
      <ul className="pokemon-grid">
        {pokemon.map((item) => (
          <PokemonCard
            key={item.id}
            pokemon={item}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  )
}
