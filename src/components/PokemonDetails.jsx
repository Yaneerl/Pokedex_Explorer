
export default function PokemonDetails({ pokemon, onBack }) {
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

      <h2>{pokemon.name}</h2>

      <p>
        Pokédex Number: #{String(pokemon.id).padStart(4, '0')}
      </p>

      <p>Types: {pokemon.types.join(', ')}</p>
    </aside>
  )
}
