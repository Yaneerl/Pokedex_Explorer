import PokemonCard from './PokemonCard.jsx'

export default function PokemonList({ pokemon }) {
  return (
    <section aria-labelledby="pokemon-heading">
      <div className="list-heading">
        <h2 id="pokemon-heading">Explore Pokémon</h2>
        <span>{pokemon.length} discovered</span>
      </div>
      <ul className="pokemon-grid">
        {pokemon.map((item) => (
          <PokemonCard key={item.id} pokemon={item} />
        ))}
      </ul>
    </section>
  )
}
