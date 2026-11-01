import { Link } from 'react-router'
import type { Pokemon } from '../types/pokemon.ts'
import type { FavoritePokemonResult } from '../hooks/useFavoritePokemon.ts'

interface PokemonComparisonFavoritesProps {
  number: number
  favorites: FavoritePokemonResult
  onSelect: (pokemon: Pokemon) => void
}

export default function PokemonComparisonFavorites({ number, favorites, onSelect }: PokemonComparisonFavoritesProps) {
  if (favorites.loading) return <p role="status">Loading favorites...</p>
  if (favorites.error) return <p role="alert">Error: {favorites.error}</p>
  if (favorites.pokemon.length === 0) return (
    <div className="comparison-empty">
      <p>No favorites yet. Add Pokémon using the heart on their details page.</p>
      <Link to="/">Explore Pokémon</Link>
    </div>
  )
  return (
    <ul className="comparison-favorites" aria-label={'Favorite Pokémon for Pokémon ' + number}>
      {favorites.pokemon.map((pokemon) => (
        <li key={pokemon.id}>
          <button type="button" aria-label={'Select ' + pokemon.name + ' for Pokémon ' + number} onClick={() => onSelect(pokemon)}>
            {pokemon.image ? <img src={pokemon.image} alt={pokemon.name + ' official artwork'} width="48" height="48" loading="lazy" /> : <span className="comparison-favorite-placeholder" aria-hidden="true">☆</span>}
            <span>#{String(pokemon.id).padStart(4, '0')} · {pokemon.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
