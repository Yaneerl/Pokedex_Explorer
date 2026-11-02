import CatalogPokemonCard from './CatalogPokemonCard.tsx'

import type { Pokemon } from '../types/pokemon.ts'

interface PokemonListProps {
  pokemon: Pokemon[]
  onSelect: (pokemon: Pokemon) => void
}

export default function PokemonList({ pokemon, onSelect }: PokemonListProps) {
  return (
    <section aria-labelledby="pokemon-heading">
      <div className="list-heading catalog-section-heading">
        <h2 id="pokemon-heading"><span className="catalog-zone" aria-hidden="true">03</span>Explore Pokémon</h2>
        <span>{pokemon.length} discovered</span>
      </div>
      <ul className="pokemon-grid catalog-grid">
        {pokemon.map((item) => (
          <CatalogPokemonCard
            key={item.id}
            pokemon={item}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  )
}
