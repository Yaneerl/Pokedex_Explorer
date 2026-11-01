import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Pokemon } from '../types/pokemon.ts'
import { readFavorites } from '../utils/favorites.ts'
import loadFavoritePokemon from '../utils/loadFavoritePokemon.ts'
import PokemonCard from './PokemonCard.tsx'
import PokemonFavoriteButton from './PokemonFavoriteButton.tsx'

interface FavoritesResult {
  pokemon: Pokemon[]
  error: string | null
}

export default function PokemonFavorites() {
  const navigate = useNavigate()
  const [saved] = useState(readFavorites)
  const [favoriteIds, setFavoriteIds] = useState(saved.ids)
  const [result, setResult] = useState<FavoritesResult | null>(null)

  useEffect(() => {
    if (saved.error || saved.ids.length === 0) return
    const controller = new AbortController()

    async function loadFavorites(): Promise<void> {
      try {
        const pokemon = await loadFavoritePokemon(saved.ids, controller.signal)
        if (!controller.signal.aborted) setResult({ pokemon, error: null })
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ pokemon: [], error: error instanceof Error ? error.message : 'Failed to load favorites.' })
          controller.abort()
        }
      }
    }

    loadFavorites()
    return () => controller.abort()
  }, [saved])

  // Removing a favorite filters the loaded cards immediately without refetching them.
  const pokemon = result?.pokemon.filter((item) => favoriteIds.includes(item.id)) ?? []
  const error = saved.error ?? result?.error
  const loading = !error && favoriteIds.length > 0 && !result

  return (
    <section className="pokemon-favorites" aria-labelledby="favorites-heading">
      <header className="app-header">
        <h1 id="favorites-heading">Favorites</h1>
        <Link className="favorites-back-link" to="/">← Back to Pokédex</Link>
      </header>
      {loading && <p role="status">Loading favorites...</p>}
      {error && <p role="alert">Error: {error}</p>}
      {!loading && !error && (favoriteIds.length === 0 ? (
        <div className="favorites-empty">
          <p>No favorites yet. Add Pokémon using the heart on their details page.</p>
          <Link to="/">Explore Pokémon</Link>
        </div>
      ) : (
        <>
          <p>{pokemon.length} favorites</p>
          <ul className="pokemon-grid pokemon-favorites-grid" aria-label="Favorite Pokémon">
            {pokemon.map((item) => (
              <PokemonCard
                key={item.id}
                pokemon={item}
                onSelect={(selected) => navigate('/pokemon/' + selected.id)}
                actions={
                  <PokemonFavoriteButton
                    pokemonId={item.id}
                    name={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    onChange={setFavoriteIds}
                  />
                }
              />
            ))}
          </ul>
        </>
      ))}
    </section>
  )
}
