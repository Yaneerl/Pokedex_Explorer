export default function PokemonCard({ pokemon }) {
  return (
    <li className="pokemon-card">
      <span className="pokemon-number">#{String(pokemon.id).padStart(4, '0')}</span>
      <div className="pokemon-placeholder" aria-hidden="true">✦</div>
      <h3>{pokemon.name}</h3>
      <div className="pokemon-types">
        {pokemon.types.map((type) => (
          <span className="type-chip" key={type}>{type}</span>
        ))}
      </div>
    </li>
  )
}
