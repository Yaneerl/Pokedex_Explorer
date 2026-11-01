import type { Pokemon } from '../types/pokemon.ts'

interface PokemonCardContentProps {
  pokemon: Pokemon
}

export default function PokemonCardContent({ pokemon }: PokemonCardContentProps) {
  return (
    <>
      <span className="pokemon-number">
        #{String(pokemon.id).padStart(4, '0')}
      </span>

      <div className="pokemon-placeholder">
        {pokemon.image ? (
          <img
            src={pokemon.image}
            alt={`${pokemon.name} official artwork`}
            width="76"
            height="76"
            loading="lazy"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <span aria-hidden="true">✦</span>
        )}
      </div>

      <h3>{pokemon.name}</h3>

      <div className="pokemon-types">
        {pokemon.types.map((type) => (
          <span className="type-chip" key={type}>
            {type}
          </span>
        ))}
      </div>
    </>
  )
}
