import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Pokemon } from '../types/pokemon.ts'
import { readFavorites } from '../utils/favorites.ts'
import toPokemonCard from '../utils/toPokemonCard.ts'
import loadFavoritePokemon from '../utils/loadFavoritePokemon.ts'
import CatalogPokemonCard from './CatalogPokemonCard.tsx'
import PokedexFrame from './PokedexFrame.tsx'
import InterfaceIcon from './InterfaceIcon.tsx'
import '../styles/pokemon-favorites.css'

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
        const data = await loadFavoritePokemon(saved.ids, controller.signal)
        const pokemon = data.map(toPokemonCard)
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
      <PokedexFrame>
        <header className="favorites-header">
          <div className="favorites-heading-panel">
            <p className="favorites-kicker">POKÉDEX / PERSONAL ARCHIVE</p>
            <h1 id="favorites-heading">My Pokémon Collection</h1>
            <p className="favorites-intro">Your discoveries. Your favorites. All in one place.</p>
          </div>
          <div className="favorites-tools">
            <div className="favorites-counter" aria-live="polite" aria-atomic="true">
              <InterfaceIcon name="heart" />
              <span><strong>{saved.error ? '—' : favoriteIds.length}</strong><span>saved Pokémon</span></span>
            </div>
            <Link className="favorites-back-link" to="/"><InterfaceIcon name="previous" />Back to Pokédex</Link>
          </div>
        </header>
        <div className="favorites-body" aria-busy={loading}>
          {loading && (
            <div className="favorites-message" role="status">
              <InterfaceIcon name="layers" />
              <div><h2>Accessing your collection</h2><p>Loading favorites...</p></div>
            </div>
          )}
          {error && (
            <div className="favorites-message favorites-message--error" role="alert">
              <InterfaceIcon name="heart" />
              <div><h2>Collection unavailable</h2><p>Error: {error}</p></div>
            </div>
          )}
          {!loading && !error && (favoriteIds.length === 0 ? (
            <section className="favorites-empty" aria-labelledby="favorites-empty-heading">
              <div className="favorites-empty-emblem" aria-hidden="true"><InterfaceIcon name="heart" /></div>
              <p className="favorites-kicker">COLLECTION / STANDBY</p>
              <h2 id="favorites-empty-heading">Your collection starts here</h2>
              <p>No Pokémon saved yet. Use the heart on a Pokémon card or details page to add it to your collection.</p>
              <Link className="favorites-discover-link" to="/">Discover Pokémon<InterfaceIcon name="next" /></Link>
            </section>
          ) : (
            <ul className="pokemon-grid pokemon-favorites-grid" aria-label="Favorite Pokémon">
              {pokemon.map((item) => (
                <CatalogPokemonCard
                  key={item.id}
                  pokemon={item}
                  onSelect={(selected) => navigate('/pokemon/' + selected.id)}
                  onFavoriteChange={setFavoriteIds}
                />
              ))}
            </ul>
          ))}
        </div>
      </PokedexFrame>
    </section>
  )
}
