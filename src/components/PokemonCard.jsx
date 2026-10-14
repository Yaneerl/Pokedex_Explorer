export default function PokemonCard({ pokemon, onSelect }) {
  return (
    <li
      className="pokemon-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(pokemon)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(pokemon)
        }
      }}
    >
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
