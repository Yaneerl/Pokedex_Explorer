
import type { Pokemon } from '../types/pokemon.ts'

interface PokemonDetailsProps {
  pokemon: Pokemon | null
  onBack: () => void
}

export default function PokemonDetails({ pokemon, onBack }: PokemonDetailsProps) {
  if (!pokemon) {
    return (
      <aside className="pokemon-details">
        <h2>Pokémon Details</h2>
        <p>Select a Pokémon to view its details.</p>
      </aside>
    )
  }

  return (
    <aside className="pokemon-details">
      <button type="button" onClick={onBack}>
        ← Back to Pokédex
      </button>

      <h2>
        {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
      </h2>

      {pokemon.image && (
        <img
          src={pokemon.image}
          alt={`${pokemon.name} official artwork`}
          width="220"
          height="220"
          style={{ objectFit: 'contain' }}
        />
      )}

      <p>
        Pokédex Number: #{String(pokemon.id).padStart(4, '0')}
      </p>

      <p>Types: {pokemon.types.join(', ')}</p>
    </aside>
  )
}
