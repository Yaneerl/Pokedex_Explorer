import { useState } from 'react'
import { readFavorites, setFavorite, writeFavorites } from '../utils/favorites.ts'
import type { FavoriteIds } from '../utils/favorites.ts'

interface PokemonFavoriteButtonProps {
  pokemonId: number
  name: string
  onChange?: (ids: FavoriteIds) => void
}

export default function PokemonFavoriteButton({ pokemonId, name, onChange }: PokemonFavoriteButtonProps) {
  const [favorites, setFavorites] = useState(readFavorites)
  const isFavorite = favorites.ids.includes(pokemonId)
  const label = isFavorite ? 'Remove ' + name + ' from favorites' : 'Add ' + name + ' to favorites'

  function toggleFavorite(): void {
    // Read the saved list again so changing this Pokémon preserves other favorites.
    const saved = readFavorites()
    if (saved.error) {
      setFavorites({ ids: favorites.ids, error: saved.error })
      return
    }
    const next = setFavorite(saved.ids, pokemonId, !isFavorite)
    const error = writeFavorites(next)
    setFavorites({ ids: error ? saved.ids : next, error })
    if (!error) onChange?.(next)
  }

  return (
    <div className="pokemon-favorite">
      <button
        type="button"
        className="pokemon-favorite-button"
        aria-label={label}
        aria-pressed={isFavorite}
        disabled={!Number.isSafeInteger(pokemonId) || pokemonId < 1}
        onClick={toggleFavorite}
      >
        <span className="pokemon-favorite-heart" aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        <span>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
      </button>
      {favorites.error && <p className="pokemon-favorite-error" role="alert">{favorites.error}</p>}
    </div>
  )
}
